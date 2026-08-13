import { desc, eq } from "drizzle-orm";

import { customerProfiles, users } from "../drizzle/schema";
import { getDb } from "./db";

export type DashboardProfileRecord = {
  profileId: number;
  userId: number;
  clientName: string | null;
  phone: string | null;
  telegramChatId: string | null;
  note: string | null;
  appointmentId: string | null;
  appointmentStatus: "pending" | "approved" | "rejected" | "rescheduled" | "cancelled" | null;
  appointmentAt: Date | null;
  updatedAt: Date;
};

function isSameLocalDay(value: Date, reference: Date) {
  return value.getFullYear() === reference.getFullYear()
    && value.getMonth() === reference.getMonth()
    && value.getDate() === reference.getDate();
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
        service: null as string | null,
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
    .select({
      profileId: customerProfiles.id,
      userId: customerProfiles.userId,
      clientName: users.name,
      phone: customerProfiles.phone,
      telegramChatId: customerProfiles.telegramChatId,
      note: customerProfiles.notes,
      appointmentId: customerProfiles.lastAppointmentId,
      appointmentStatus: customerProfiles.lastAppointmentStatus,
      appointmentAt: customerProfiles.lastAppointmentAt,
      updatedAt: customerProfiles.updatedAt,
    })
    .from(customerProfiles)
    .leftJoin(users, eq(customerProfiles.userId, users.id))
    .orderBy(desc(customerProfiles.updatedAt))
    .limit(40);

  return { databaseAvailable: true, ...createDashboardSnapshot(records) };
}
