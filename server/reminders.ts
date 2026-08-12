import { createHeartbeatJob } from "./_core/heartbeat";
import { eq } from "drizzle-orm";

import { customerProfiles } from "../drizzle/schema";
import { sendBookingReminderNotification } from "./telegram";
import { getDb } from "./db";

type ApprovedBooking = {
  bookingId: string;
  customerUserId?: number;
  chatId?: string;
  customerName: string;
  salonName: string;
  serviceName: string;
  appointmentAtISO: string;
  appointmentAtLabel: string;
  staffName: string;
  reminderSent: boolean;
};

const approvedBookings = new Map<string, ApprovedBooking>();
let heartbeatTaskUid: string | undefined;
let heartbeatSetupPromise: Promise<void> | undefined;

export function registerApprovedBooking(booking: Omit<ApprovedBooking, "reminderSent">) {
  const existing = approvedBookings.get(booking.bookingId);
  approvedBookings.set(booking.bookingId, { ...booking, reminderSent: existing?.reminderSent ?? false });
}

export async function ensureReminderHeartbeat() {
  if (heartbeatTaskUid || heartbeatSetupPromise) return heartbeatSetupPromise;
  heartbeatSetupPromise = createHeartbeatJob({
    name: "salon-connect-telegram-reminders",
    cron: "0 * * * * *",
    path: "/api/scheduled/telegram-reminders",
    description: "Checks approved Salon Connect appointments and sends Telegram reminders 24 hours before the appointment.",
  }, "").then(({ taskUid }) => {
    heartbeatTaskUid = taskUid;
  }).finally(() => {
    heartbeatSetupPromise = undefined;
  });
  return heartbeatSetupPromise;
}

export async function processDueTelegramReminders(now = Date.now()) {
  const due: string[] = [];
  for (const booking of approvedBookings.values()) {
    const appointmentTime = Date.parse(booking.appointmentAtISO);
    const reminderTime = appointmentTime - 24 * 60 * 60 * 1000;
    if (!booking.reminderSent && now >= reminderTime && now < appointmentTime) {
      const result = await sendBookingReminderNotification(booking);
      if (result.delivered || result.duplicate) {
        booking.reminderSent = true;
        if (booking.customerUserId) {
          const db = await getDb();
          if (db) {
            await db.update(customerProfiles).set({ reminderStatus: "sent", updatedAt: new Date() }).where(eq(customerProfiles.userId, booking.customerUserId));
          }
        }
        due.push(booking.bookingId);
      }
    }
  }
  return { processed: due.length, bookingIds: due };
}

export function getReminderState() {
  return { trackedBookings: approvedBookings.size, heartbeatConfigured: Boolean(heartbeatTaskUid) };
}
