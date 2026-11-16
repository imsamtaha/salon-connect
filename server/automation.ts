import { and, eq, or } from "drizzle-orm";

import { automationJobs, customerProfiles } from "../drizzle/schema";
import { getDb } from "./db";
import { ensureReminderHeartbeat, processDueTelegramReminders } from "./reminders";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
type AppDatabase = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type AppDatabaseTransaction = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];

export type ApprovedAppointmentAutomationInput = {
  bookingId: string;
  customerUserId?: number;
  chatId?: string;
  customerName: string;
  salonName: string;
  serviceName: string;
  appointmentAt: string;
  appointmentAtISO: string;
  staffName: string;
};

export function reminderRunAt(appointmentTime: number, now = Date.now()) {
  if (!Number.isFinite(appointmentTime) || appointmentTime <= now) return null;
  return Math.max(now, appointmentTime - DAY_MS);
}

function buildJobValues(input: ApprovedAppointmentAutomationInput, now: Date) {
  const appointmentTime = Date.parse(input.appointmentAtISO);
  const appointmentAtISO = new Date(appointmentTime).toISOString();
  const payload = JSON.stringify({
    bookingId: input.bookingId,
    customerUserId: input.customerUserId,
    chatId: input.chatId,
    customerName: input.customerName,
    salonName: input.salonName,
    serviceName: input.serviceName,
    appointmentAt: input.appointmentAt,
    appointmentAtISO,
    appointmentAtLabel: input.appointmentAt,
    staffName: input.staffName,
  });
  const reminderAt = reminderRunAt(appointmentTime, now.getTime());

  return {
    appointmentTime,
    reminderAt,
    payload,
    approvalJob: {
      dedupeKey: `telegram:booking-approval:${input.bookingId}`,
      type: "booking_approval" as const,
      bookingId: input.bookingId,
      payload,
      runAt: now,
      status: "scheduled" as const,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      createdAt: now,
      updatedAt: now,
    },
    reminderJob: reminderAt === null ? null : {
      dedupeKey: `telegram:booking-reminder:${input.bookingId}:${appointmentAtISO}`,
      type: "booking_reminder" as const,
      bookingId: input.bookingId,
      payload,
      runAt: new Date(reminderAt),
      status: "scheduled" as const,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      createdAt: now,
      updatedAt: now,
    },
  };
}

async function insertOrRequeueJob(db: AppDatabase | AppDatabaseTransaction, job: typeof automationJobs.$inferInsert) {
  await db.insert(automationJobs).values(job).onConflictDoNothing();

  const [existing] = await db
    .select({ id: automationJobs.id, status: automationJobs.status })
    .from(automationJobs)
    .where(eq(automationJobs.dedupeKey, job.dedupeKey))
    .limit(1);

  if (existing && (existing.status === "failed" || existing.status === "cancelled")) {
    await db
      .update(automationJobs)
      .set({
        status: "scheduled",
        payload: job.payload,
        runAt: job.runAt,
        attempts: 0,
        lastError: null,
        lastAttemptAt: null,
        completedAt: null,
        updatedAt: job.updatedAt ?? new Date(),
      })
      .where(and(
        eq(automationJobs.id, existing.id),
        or(eq(automationJobs.status, "failed"), eq(automationJobs.status, "cancelled")),
      ));
  }
}

export async function cancelPendingBookingAutomations(bookingId: string, transaction?: AppDatabaseTransaction) {
  const db = transaction ?? await getDb();
  if (!db) return { cancelled: 0 };
  const now = new Date();
  const result = await db
    .update(automationJobs)
    .set({ status: "cancelled", lastError: "booking_no_longer_approved", updatedAt: now })
    .where(and(eq(automationJobs.bookingId, bookingId), eq(automationJobs.status, "scheduled")))
    .returning({ id: automationJobs.id });
  await db
    .update(customerProfiles)
    .set({ reminderStatus: "cancelled", updatedAt: now })
    .where(eq(customerProfiles.lastAppointmentId, bookingId));
  return { cancelled: result.length };
}

export async function runApprovedAppointmentAutomation(
  input: ApprovedAppointmentAutomationInput,
  updateBooking: (transaction: AppDatabaseTransaction) => Promise<void>,
) {
  const appointmentTime = Date.parse(input.appointmentAtISO);
  if (!Number.isFinite(appointmentTime)) {
    throw new Error("appointmentAtISO must be a valid ISO timestamp");
  }

  const db = await getDb();
  if (!db) throw new Error("database_unavailable");

  const now = new Date();
  const jobs = buildJobValues(input, now);
  const reminderAt = jobs.reminderAt === null ? null : new Date(jobs.reminderAt);

  await db.transaction(async (transaction) => {
    await updateBooking(transaction);

    if (input.customerUserId) {
      await transaction
        .update(customerProfiles)
        .set({
          lastAppointmentId: input.bookingId,
          lastAppointmentStatus: "approved",
          lastAppointmentAt: new Date(jobs.appointmentTime),
          lastReminderAt: reminderAt,
          reminderStatus: reminderAt ? "scheduled" : "not_scheduled",
          updatedAt: now,
        })
        .where(eq(customerProfiles.userId, input.customerUserId));
    }

    // A changed appointment invalidates any reminder that has not yet been sent.
    await transaction
      .update(automationJobs)
      .set({ status: "cancelled", lastError: "appointment_updated", updatedAt: now })
      .where(and(
        eq(automationJobs.bookingId, input.bookingId),
        eq(automationJobs.type, "booking_reminder"),
        eq(automationJobs.status, "scheduled"),
      ));

    await insertOrRequeueJob(transaction, jobs.approvalJob);
    if (jobs.reminderJob) await insertOrRequeueJob(transaction, jobs.reminderJob);
  });

  const reminderScheduler = await ensureReminderHeartbeat()
    .then(() => "scheduled" as const)
    .catch(() => "scheduler_unavailable" as const);

  // The approval notification is due immediately. The worker persists the
  // attempt before returning; failures remain queued for automatic retry.
  await processDueTelegramReminders(now.getTime());

  const [approvalJob] = await db
    .select({ status: automationJobs.status, lastError: automationJobs.lastError })
    .from(automationJobs)
    .where(eq(automationJobs.dedupeKey, jobs.approvalJob.dedupeKey))
    .limit(1);

  return {
    snapshot: {
      bookingId: input.bookingId,
      status: "approved" as const,
      salonName: input.salonName,
      serviceName: input.serviceName,
      staffName: input.staffName,
      appointmentAt: input.appointmentAt,
      appointmentAtISO: new Date(appointmentTime).toISOString(),
      reminderAtISO: reminderAt?.toISOString() ?? null,
      updatedAtISO: now.toISOString(),
    },
    reminderScheduler,
    notification: {
      delivered: approvalJob?.status === "sent",
      duplicate: false,
      reason: approvalJob?.lastError ?? (approvalJob?.status === "sent" ? "sent" : "queued_for_retry"),
    },
    customerRecordUpdated: Boolean(input.customerUserId),
    queuedJobs: jobs.reminderJob ? 2 : 1,
  };
}
