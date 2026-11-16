import { and, asc, eq, gte, lt, lte, or, sql } from "drizzle-orm";

import { automationJobs, customerProfiles } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { createHeartbeatJob, listHeartbeatJobs, updateHeartbeatJob } from "./_core/heartbeat";
import { getDb } from "./db";
import { sendBookingApprovalNotification, sendBookingReminderNotification } from "./telegram";

const HEARTBEAT_NAME = "salon-connect-telegram-reminders";
const HEARTBEAT_CRON = "0 * * * * *";
const HEARTBEAT_PATH = "/api/scheduled/telegram-reminders";
const BATCH_SIZE = 25;
const LEASE_MS = 5 * 60 * 1000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;
const POLL_INTERVAL_MS = 60 * 1000;

type BookingNotificationPayload = {
  bookingId: string;
  customerUserId?: number;
  chatId?: string;
  customerName: string;
  salonName: string;
  serviceName: string;
  appointmentAt?: string;
  appointmentAtISO: string;
  appointmentAtLabel?: string;
  staffName: string;
};

let heartbeatTaskUid: string | undefined;
let heartbeatSetupPromise: Promise<void> | undefined;
let localWorkerTimer: NodeJS.Timeout | undefined;
let processing = false;

export async function ensureReminderHeartbeat() {
  if (!ENV.automationWebhookSecret) {
    throw new Error("AUTOMATION_WEBHOOK_SECRET is required for the scheduled callback");
  }
  if (heartbeatTaskUid) return;
  if (heartbeatSetupPromise) return heartbeatSetupPromise;

  heartbeatSetupPromise = (async () => {
    const job = {
      name: HEARTBEAT_NAME,
      cron: HEARTBEAT_CRON,
      path: HEARTBEAT_PATH,
      method: "POST" as const,
      payload: { token: ENV.automationWebhookSecret },
      description: "Processes durable Salon Connect booking notifications and appointment reminders.",
    };
    const existing = await listHeartbeatJobs("", { page: 1, pageSize: 100 });
    const current = existing.jobs.find((item) => item.name === HEARTBEAT_NAME);

    if (current) {
      await updateHeartbeatJob(current.taskUid, {
        cron: job.cron,
        path: job.path,
        method: job.method,
        payload: job.payload,
        description: job.description,
        enable: true,
      }, "");
      heartbeatTaskUid = current.taskUid;
      return;
    }

    const created = await createHeartbeatJob(job, "");
    heartbeatTaskUid = created.taskUid;
  })().finally(() => {
    heartbeatSetupPromise = undefined;
  });

  return heartbeatSetupPromise;
}

function retryDelayMs(attempt: number) {
  return Math.min(60_000 * 2 ** Math.max(0, attempt - 1), MAX_RETRY_DELAY_MS);
}

function errorText(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 1000);
  return String(error).slice(0, 1000);
}

function decodePayload(value: string): BookingNotificationPayload {
  const payload = JSON.parse(value) as Partial<BookingNotificationPayload>;
  if (
    typeof payload.bookingId !== "string" ||
    typeof payload.customerName !== "string" ||
    typeof payload.salonName !== "string" ||
    typeof payload.serviceName !== "string" ||
    typeof payload.staffName !== "string" ||
    typeof payload.appointmentAtISO !== "string"
  ) {
    throw new Error("invalid_automation_job_payload");
  }
  return payload as BookingNotificationPayload;
}

async function claimDueJob(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, now: Date) {
  const staleBefore = new Date(now.getTime() - LEASE_MS);

  await db
    .update(automationJobs)
    .set({
      status: "failed",
      lastError: "worker_lease_expired_after_max_attempts",
      updatedAt: now,
    })
    .where(and(
      eq(automationJobs.status, "processing"),
      lte(automationJobs.updatedAt, staleBefore),
      gte(automationJobs.attempts, automationJobs.maxAttempts),
    ));

  const [candidate] = await db
    .select()
    .from(automationJobs)
    .where(or(
      and(
        eq(automationJobs.status, "scheduled"),
        lte(automationJobs.runAt, now),
        lt(automationJobs.attempts, automationJobs.maxAttempts),
      ),
      and(
        eq(automationJobs.status, "processing"),
        lte(automationJobs.updatedAt, staleBefore),
        lt(automationJobs.attempts, automationJobs.maxAttempts),
      ),
    ))
    .orderBy(asc(automationJobs.runAt), asc(automationJobs.id))
    .limit(1);

  if (!candidate) return null;

  const claimCondition = candidate.status === "scheduled"
    ? and(
      eq(automationJobs.id, candidate.id),
      eq(automationJobs.status, "scheduled"),
      lte(automationJobs.runAt, now),
    )
    : and(
      eq(automationJobs.id, candidate.id),
      eq(automationJobs.status, "processing"),
      lte(automationJobs.updatedAt, staleBefore),
    );

  const [claimed] = await db
    .update(automationJobs)
    .set({
      status: "processing",
      attempts: sql`${automationJobs.attempts} + 1`,
      lastAttemptAt: now,
      updatedAt: now,
    })
    .where(claimCondition)
    .returning();

  return claimed ?? null;
}

async function completeJob(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, jobId: number, now: Date) {
  await db.update(automationJobs).set({
    status: "sent",
    lastError: null,
    completedAt: now,
    updatedAt: now,
  }).where(eq(automationJobs.id, jobId));
}

async function retryOrFailJob(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  job: typeof automationJobs.$inferSelect,
  now: Date,
  error: string,
) {
  const exhausted = job.attempts >= job.maxAttempts;
  await db.update(automationJobs).set({
    status: exhausted ? "failed" : "scheduled",
    runAt: exhausted ? job.runAt : new Date(now.getTime() + retryDelayMs(job.attempts)),
    lastError: error,
    updatedAt: now,
  }).where(eq(automationJobs.id, job.id));

  if (exhausted && job.type === "booking_reminder") {
    try {
      const customerUserId = decodePayload(job.payload).customerUserId;
      if (customerUserId) {
        await db.update(customerProfiles).set({ reminderStatus: "failed", updatedAt: now })
          .where(eq(customerProfiles.userId, customerUserId));
      }
    } catch {
      // Keep the failed job record even if its optional customer snapshot is invalid.
    }
  }
}

export async function processDueTelegramReminders(nowTimestamp = Date.now()) {
  if (processing) return { processed: 0, attempted: 0, failed: 0, inProgress: true };
  processing = true;

  try {
    const db = await getDb();
    if (!db) return { processed: 0, attempted: 0, failed: 0, databaseAvailable: false };

    let attempted = 0;
    let processed = 0;
    let failed = 0;
    const sentBookingIds: string[] = [];
    const now = new Date(nowTimestamp);

    for (let index = 0; index < BATCH_SIZE; index += 1) {
      const job = await claimDueJob(db, now);
      if (!job) break;
      attempted += 1;

      try {
        const payload = decodePayload(job.payload);
        if (job.type === "booking_reminder" && Date.parse(payload.appointmentAtISO) <= nowTimestamp) {
          await db.update(automationJobs).set({
            status: "cancelled",
            lastError: "appointment_already_started",
            updatedAt: now,
          }).where(eq(automationJobs.id, job.id));
          continue;
        }

        const result = job.type === "booking_approval"
          ? await sendBookingApprovalNotification(payload)
          : await sendBookingReminderNotification(payload);

        if (result.delivered || result.duplicate) {
          await completeJob(db, job.id, now);
          if (job.type === "booking_reminder" && payload.customerUserId) {
            try {
              await db.update(customerProfiles).set({
                reminderStatus: "sent",
                updatedAt: now,
              }).where(eq(customerProfiles.userId, payload.customerUserId));
            } catch (error) {
              console.warn("[automation-worker] reminder profile update failed", error);
            }
          }
          processed += 1;
          sentBookingIds.push(job.bookingId);
        } else {
          const description = "description" in result ? result.description : undefined;
          await retryOrFailJob(db, job, now, [result.reason, description].filter(Boolean).join(": "));
          if (job.attempts >= job.maxAttempts) failed += 1;
        }
      } catch (error) {
        await retryOrFailJob(db, job, now, errorText(error));
        if (job.attempts >= job.maxAttempts) failed += 1;
      }
    }

    return { processed, attempted, failed, bookingIds: sentBookingIds, databaseAvailable: true };
  } finally {
    processing = false;
  }
}

export function startAutomationWorker(intervalMs = POLL_INTERVAL_MS) {
  if (localWorkerTimer) return localWorkerTimer;

  const run = () => {
    void processDueTelegramReminders().catch((error) => {
      console.error("[automation-worker] tick failed", error);
    });
  };

  run();
  localWorkerTimer = setInterval(run, intervalMs);
  localWorkerTimer.unref?.();
  return localWorkerTimer;
}

export async function getReminderState() {
  const db = await getDb();
  if (!db) {
    return { trackedBookings: 0, scheduledJobs: 0, failedJobs: 0, heartbeatConfigured: Boolean(heartbeatTaskUid) };
  }

  const [scheduled] = await db
    .select({ total: sql<number>`count(*)` })
    .from(automationJobs)
    .where(eq(automationJobs.status, "scheduled"));
  const [failed] = await db
    .select({ total: sql<number>`count(*)` })
    .from(automationJobs)
    .where(eq(automationJobs.status, "failed"));
  const [tracked] = await db
    .select({ total: sql<number>`count(distinct ${automationJobs.bookingId})` })
    .from(automationJobs);

  return {
    trackedBookings: Number(tracked?.total ?? 0),
    scheduledJobs: Number(scheduled?.total ?? 0),
    failedJobs: Number(failed?.total ?? 0),
    heartbeatConfigured: Boolean(heartbeatTaskUid),
  };
}
