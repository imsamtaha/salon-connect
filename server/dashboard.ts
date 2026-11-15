import { desc } from "drizzle-orm";

import { bookings } from "../drizzle/schema";
import { getDb } from "./db";

export type DashboardProfileRecord = {
  profileId: number;
  userId: number;
  clientName: string | null;
  phone: string | null;
  telegramChatId: string | null;
  note: string | null;
  serviceName?: string | null;
  appointmentId: string | null;
  appointmentStatus: "pending" | "approved" | "rejected" | "rescheduled" | "cancelled" | null;
  appointmentAt: Date | null;
  updatedAt: Date;
};

function isSameLocalDay(value: Date, reference: Date) {
  const day = (date: Date) => new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.SALON_TIMEZONE || "Asia/Beirut",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
  return day(value) === day(reference);
}

function nextAction(status: DashboardProfileRecord["appointmentStatus"]) {
  if (status === "pending") return "review" as const;
  if (status === "approved") return "view" as const;
  if (status === "rescheduled") return "reschedule" as const;
  return "follow_up" as const;
}

export function createDashboardSnapshot(records: DashboardProfileRecord[], now = new Date()) {
  const appointmentRecords = records.filter((record) => record.appointmentId);
  const today = appointmentRecords.filter((record) => record.appointmentAt && isSameLocalDay(record.appointmentAt, now));
  const confirmed = today.filter((record) => record.appointmentStatus === "approved");
  const pending = today.filter((record) => record.appointmentStatus === "pending");

  return {
    generatedAt: now.toISOString(),
    metrics: {
      appointmentsToday: today.length,
      confirmed: confirmed.length,
      pending: pending.length,
      estimatedRevenue: null as number | null,
      unpricedAppointments: confirmed.length,
    },
    rows: appointmentRecords
      .sort((left, right) => (right.updatedAt?.getTime() ?? 0) - (left.updatedAt?.getTime() ?? 0))
      .slice(0, 20)
      .map((record) => ({
        id: record.appointmentId as string,
        client: record.clientName?.trim() || "Customer record",
        service: record.serviceName ?? null,
        appointmentAtISO: record.appointmentAt?.toISOString() ?? null,
        status: record.appointmentStatus ?? "pending",
        contactChannel: record.telegramChatId ? "Telegram" : record.phone ? "Direct" : "Website",
        hasCustomerNote: Boolean(record.note?.trim()),
        nextAction: nextAction(record.appointmentStatus),
      })),
  };
}

export async function getManagerDashboardSnapshot() {
  const db = await getDb();
  if (!db) {
    return { databaseAvailable: false, ...createDashboardSnapshot([]) };
  }

  const records = await db
    .select()
    .from(bookings)
    .orderBy(desc(bookings.updatedAt));

  return {
    databaseAvailable: true,
    ...createDashboardSnapshot(records.map((record) => ({
      profileId: record.id,
      userId: record.customerUserId ?? 0,
      clientName: record.customerName,
      phone: null,
      telegramChatId: record.contactChannel === "telegram" ? "connected" : null,
      note: record.customerNote,
      serviceName: record.serviceName,
      appointmentId: record.publicId,
      appointmentStatus: record.status,
      appointmentAt: record.appointmentAt,
      updatedAt: record.updatedAt,
    }))),
  };
}

