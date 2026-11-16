import { desc, eq } from "drizzle-orm";

import { bookings, conversations, customerProfiles, messages } from "../drizzle/schema";
import { cancelPendingBookingAutomations, runApprovedAppointmentAutomation } from "./automation";
import { getDb } from "./db";

export type BookingStatus = "pending" | "approved" | "rejected" | "rescheduled" | "cancelled";
export type ContactChannel = "telegram" | "whatsapp" | "direct";

export type CreateBookingInput = {
  customerUserId?: number;
  customerName: string;
  salonName?: string;
  serviceName: string;
  staffName: string;
  appointmentAtISO: string;
  appointmentLabel: string;
  customerNote?: string;
  contactChannel?: ContactChannel;
};

export type BookingRecord = {
  id: number;
  publicId: string;
  customerUserId: number | null;
  customerName: string;
  salonName: string;
  serviceName: string;
  staffName: string;
  appointmentAt: Date;
  appointmentLabel: string;
  customerNote: string | null;
  managerNote: string | null;
  status: BookingStatus;
  contactChannel: ContactChannel;
  createdAt: Date;
  updatedAt: Date;
};

export function toQueueItem(record: BookingRecord) {
  return {
    id: record.publicId,
    customer: record.customerName,
    service: record.serviceName,
    staff: record.staffName,
    date: record.appointmentLabel,
    time: "",
    note: record.customerNote ?? "",
    managerNote: record.managerNote ?? "",
    status: record.status,
    contactChannel: record.contactChannel,
    appointmentAtISO: record.appointmentAt.toISOString(),
  };
}

export function nextBookingPublicId(existingCount: number) {
  return `BC-${String(existingCount + 1).padStart(4, "0")}`;
}

function asRecord(row: typeof bookings.$inferSelect): BookingRecord {
  return {
    ...row,
    customerUserId: row.customerUserId ?? null,
    status: row.status,
    contactChannel: row.contactChannel,
  };
}

export async function listBookings(options: { customerUserId?: number } = {}) {
  const db = await getDb();
  if (!db) {
    return { databaseAvailable: false as const, items: [] as ReturnType<typeof toQueueItem>[] };
  }

  const rows = options.customerUserId
    ? await db.select().from(bookings).where(eq(bookings.customerUserId, options.customerUserId)).orderBy(desc(bookings.updatedAt))
    : await db.select().from(bookings).orderBy(desc(bookings.updatedAt));

  return {
    databaseAvailable: true as const,
    items: rows.map((row) => toQueueItem(asRecord(row))),
  };
}

export async function getLatestBooking(customerUserId?: number) {
  const db = await getDb();
  if (!db) return { databaseAvailable: false as const, appointment: null };
  if (!customerUserId) return { databaseAvailable: true as const, appointment: null };

  const [row] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.customerUserId, customerUserId))
    .orderBy(desc(bookings.createdAt))
    .limit(1);

  if (!row) return { databaseAvailable: true as const, appointment: null };

  return {
    databaseAvailable: true as const,
    appointment: {
      id: row.publicId,
      status: row.status,
      appointmentAtISO: row.appointmentAt.toISOString(),
      staffName: row.staffName,
      serviceName: row.serviceName,
      hasCustomerNote: Boolean(row.customerNote?.trim()),
    },
  };
}

export async function createBookingRequest(input: CreateBookingInput) {
  const db = await getDb();
  if (!db) {
    throw new Error("database_unavailable");
  }

  const appointmentAt = new Date(input.appointmentAtISO);
  if (Number.isNaN(appointmentAt.getTime())) {
    throw new Error("appointmentAtISO must be a valid ISO timestamp");
  }

  const existing = await db.select({ id: bookings.id }).from(bookings);
  const now = new Date();
  const publicId = nextBookingPublicId(existing.length);
  const salonName = input.salonName?.trim() || "JUST beauty";
  const contactChannel = input.contactChannel ?? "telegram";

  await db.insert(bookings).values({
    publicId,
    customerUserId: input.customerUserId,
    customerName: input.customerName,
    salonName,
    serviceName: input.serviceName,
    staffName: input.staffName,
    appointmentAt,
    appointmentLabel: input.appointmentLabel,
    customerNote: input.customerNote?.trim() || null,
    managerNote: null,
    status: "pending",
    contactChannel,
    createdAt: now,
    updatedAt: now,
  });

  if (input.customerUserId) {
    const profileValues = {
      userId: input.customerUserId,
      preferredStaff: input.staffName,
      notes: input.customerNote?.trim() || null,
      lastAppointmentId: publicId,
      lastAppointmentStatus: "pending" as const,
      lastAppointmentAt: appointmentAt,
      reminderStatus: "not_scheduled" as const,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(customerProfiles).values(profileValues).onConflictDoUpdate({
      target: customerProfiles.userId,
      set: {
        preferredStaff: input.staffName,
        notes: input.customerNote?.trim() || null,
        lastAppointmentId: publicId,
        lastAppointmentStatus: "pending",
        lastAppointmentAt: appointmentAt,
        updatedAt: now,
      },
    });

    const conversationResult = await db.insert(conversations).values({
      userId: input.customerUserId,
      title: input.serviceName,
      salonName,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: conversations.id });

    const conversationId = conversationResult[0]?.id;
    if (conversationId) {
      await db.insert(messages).values({
        conversationId,
        userId: input.customerUserId,
        sender: "customer",
        body: input.customerNote?.trim() || `طلب حجز جديد: ${input.serviceName} مع ${input.staffName}`,
        read: false,
        createdAt: now,
      });
    }
  }

  return { publicId, status: "pending" as const, databaseAvailable: true as const };
}

export async function decideBooking(input: {
  bookingId: string;
  status: "approved" | "rejected";
  managerNote?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("database_unavailable");

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.publicId, input.bookingId))
    .limit(1);
  if (!booking) throw new Error("booking_not_found");

  const now = new Date();

  if (input.status !== "approved") {
    await db.transaction(async (transaction) => {
      await transaction.update(bookings).set({
        status: input.status,
        managerNote: input.managerNote?.trim() || null,
        updatedAt: now,
      }).where(eq(bookings.publicId, input.bookingId));
      if (booking.customerUserId) {
        await transaction.update(customerProfiles).set({
          lastAppointmentStatus: "rejected",
          reminderStatus: "cancelled",
          updatedAt: now,
        }).where(eq(customerProfiles.userId, booking.customerUserId));
      }
      await cancelPendingBookingAutomations(input.bookingId, transaction);
    });
    return {
      bookingId: input.bookingId,
      status: input.status,
      notification: { delivered: false, skipped: true as const },
      reminderScheduler: "not_scheduled" as const,
      customerRecordUpdated: false,
      reminderAtISO: null as string | null,
    };
  }

  const [customerProfile] = booking.customerUserId
    ? await db.select({ chatId: customerProfiles.telegramChatId })
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, booking.customerUserId))
      .limit(1)
    : [];

  const automation = await runApprovedAppointmentAutomation({
    bookingId: booking.publicId,
    customerUserId: booking.customerUserId ?? undefined,
    chatId: customerProfile?.chatId ?? undefined,
    customerName: booking.customerName,
    salonName: booking.salonName,
    serviceName: booking.serviceName,
    appointmentAt: booking.appointmentLabel,
    appointmentAtISO: booking.appointmentAt.toISOString(),
    staffName: booking.staffName,
  }, async (transaction) => {
    await transaction.update(bookings).set({
      status: "approved",
      managerNote: input.managerNote?.trim() || null,
      updatedAt: now,
    }).where(eq(bookings.publicId, input.bookingId));
  });
  return {
    bookingId: input.bookingId,
    status: "approved" as const,
    notification: automation.notification,
    reminderScheduler: automation.reminderScheduler,
    customerRecordUpdated: automation.customerRecordUpdated,
    reminderAtISO: automation.snapshot.reminderAtISO,
  };
}
