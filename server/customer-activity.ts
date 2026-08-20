import { desc, eq, inArray } from "drizzle-orm";

import { conversations, customerProfiles, messages } from "../drizzle/schema";
import { getDb } from "./db";

export type BookingActivityRecord = {
  appointmentId: string | null;
  appointmentStatus: "pending" | "approved" | "rejected" | "rescheduled" | "cancelled" | null;
  appointmentAt: Date | null;
  preferredStaff: string | null;
  notes: string | null;
};

export type ConversationFeedRecord = {
  id: number;
  title: string;
  salonName: string | null;
  preview: string | null;
  updatedAt: Date;
};

export function createBookingActivitySnapshot(record: BookingActivityRecord | null) {
  if (!record?.appointmentId) {
    return { appointment: null };
  }

  return {
    appointment: {
      id: record.appointmentId,
      status: record.appointmentStatus ?? "pending",
      appointmentAtISO: record.appointmentAt?.toISOString() ?? null,
      staffName: record.preferredStaff,
      hasCustomerNote: Boolean(record.notes?.trim()),
    },
  };
}

export function createConversationFeed(records: ConversationFeedRecord[]) {
  return {
    threads: records.map((record) => {
      const name = record.salonName?.trim() || record.title.trim() || "Center";
      return {
        id: String(record.id),
        name,
        preview: record.preview?.trim() || "",
        updatedAtISO: record.updatedAt.toISOString(),
        initial: name.slice(0, 1).toUpperCase(),
      };
    }),
  };
}

export async function getBookingActivityFeed(userId?: number) {
  const db = await getDb();
  if (!db) {
    return { databaseAvailable: false, ...createBookingActivitySnapshot(null) };
  }

  if (!userId) {
    return { databaseAvailable: true, ...createBookingActivitySnapshot(null) };
  }

  const [record] = await db
    .select({
      appointmentId: customerProfiles.lastAppointmentId,
      appointmentStatus: customerProfiles.lastAppointmentStatus,
      appointmentAt: customerProfiles.lastAppointmentAt,
      preferredStaff: customerProfiles.preferredStaff,
      notes: customerProfiles.notes,
    })
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, userId))
    .limit(1);

  return { databaseAvailable: true, ...createBookingActivitySnapshot(record ?? null) };
}

export async function getConversationFeed(userId?: number) {
  const db = await getDb();
  if (!db) {
    return { databaseAvailable: false, ...createConversationFeed([]) };
  }

  if (!userId) {
    return { databaseAvailable: true, ...createConversationFeed([]) };
  }

  const threadRows = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      salonName: conversations.salonName,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(20);

  if (threadRows.length === 0) {
    return { databaseAvailable: true, ...createConversationFeed([]) };
  }

  const latestMessages = await db
    .select({
      conversationId: messages.conversationId,
      body: messages.body,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(inArray(messages.conversationId, threadRows.map((row) => row.id)))
    .orderBy(desc(messages.createdAt));

  const previewByConversation = new Map<number, string>();
  for (const message of latestMessages) {
    if (!previewByConversation.has(message.conversationId)) {
      previewByConversation.set(message.conversationId, message.body);
    }
  }

  return {
    databaseAvailable: true,
    ...createConversationFeed(
      threadRows.map((row) => ({
        ...row,
        preview: previewByConversation.get(row.id) ?? null,
      })),
    ),
  };
}
