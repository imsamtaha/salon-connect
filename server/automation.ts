import { eq } from "drizzle-orm";

import { customerProfiles } from "../drizzle/schema";
import { getDb } from "./db";
import { ensureReminderHeartbeat, registerApprovedBooking } from "./reminders";

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

type CustomerAppointmentSnapshot = {
  bookingId: string;
  status: "approved";
  salonName: string;
  serviceName: string;
  staffName: string;
  appointmentAt: string;
  appointmentAtISO: string;
  reminderAtISO: string;
  updatedAtISO: string;
};

const customerSnapshots = new Map<number, CustomerAppointmentSnapshot>();

export async function runApprovedAppointmentAutomation(input: ApprovedAppointmentAutomationInput) {
  const appointmentTime = Date.parse(input.appointmentAtISO);
  if (!Number.isFinite(appointmentTime)) {
    throw new Error("appointmentAtISO must be a valid ISO timestamp");
  }

  const snapshot: CustomerAppointmentSnapshot = {
    bookingId: input.bookingId,
    status: "approved",
    salonName: input.salonName,
    serviceName: input.serviceName,
    staffName: input.staffName,
    appointmentAt: input.appointmentAt,
    appointmentAtISO: input.appointmentAtISO,
    reminderAtISO: new Date(appointmentTime - 24 * 60 * 60 * 1000).toISOString(),
    updatedAtISO: new Date().toISOString(),
  };

  if (input.customerUserId) {
    customerSnapshots.set(input.customerUserId, snapshot);
    const db = await getDb();
    if (db) {
      await db
        .update(customerProfiles)
        .set({
          lastAppointmentId: input.bookingId,
          lastAppointmentStatus: "approved",
          lastAppointmentAt: new Date(appointmentTime),
          lastReminderAt: new Date(appointmentTime - 24 * 60 * 60 * 1000),
          reminderStatus: "scheduled",
          updatedAt: new Date(),
        })
        .where(eq(customerProfiles.userId, input.customerUserId));
    }
  }

  registerApprovedBooking({
    bookingId: input.bookingId,
    customerUserId: input.customerUserId,
    chatId: input.chatId,
    customerName: input.customerName,
    salonName: input.salonName,
    serviceName: input.serviceName,
    appointmentAtISO: input.appointmentAtISO,
    appointmentAtLabel: input.appointmentAt,
    staffName: input.staffName,
  });

  const reminderScheduler = await ensureReminderHeartbeat()
    .then(() => "scheduled" as const)
    .catch(() => "scheduler_unavailable" as const);

  return {
    snapshot,
    reminderScheduler,
    customerRecordUpdated: Boolean(input.customerUserId),
  };
}

export function getCustomerAppointmentSnapshot(customerUserId: number) {
  return customerSnapshots.get(customerUserId) ?? null;
}

export function clearCustomerAppointmentAutomation(customerUserId: number) {
  customerSnapshots.delete(customerUserId);
}
