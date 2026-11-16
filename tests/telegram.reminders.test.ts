import { beforeEach, describe, expect, it, vi } from "vitest";
import { automationJobs, bookings, customerProfiles } from "../drizzle/schema";

const sendApproval = vi.fn(async () => ({ delivered: true, duplicate: false, reason: "sent" as const }));
const sendReminder = vi.fn(async (): Promise<{ delivered: boolean; duplicate: boolean; reason: string }> => ({ delivered: true, duplicate: false, reason: "sent" }));
vi.mock("../server/telegram", () => ({
  sendBookingApprovalNotification: sendApproval,
  sendBookingReminderNotification: sendReminder,
}));

vi.stubEnv("DATABASE_URL", `file:/tmp/just-ai-salon-automation-${process.pid}.db`);
vi.stubEnv("AUTOMATION_WEBHOOK_SECRET", "");
const { getDb } = await import("../server/db");
const { processDueTelegramReminders } = await import("../server/reminders");
const { decideBooking } = await import("../server/bookings");

const reminderPayload = {
  bookingId: "test-reminder-1",
  customerName: "Test Customer",
  salonName: "Test Salon",
  serviceName: "Haircut",
  appointmentAt: "Tomorrow at 6:30 PM",
  appointmentAtISO: "2026-08-14T15:30:00.000Z",
  appointmentAtLabel: "Tomorrow at 6:30 PM",
  staffName: "Sara",
};

async function insertReminder(runAt: Date, bookingId = reminderPayload.bookingId) {
  const db = await getDb();
  if (!db) throw new Error("test database unavailable");

  await db.insert(automationJobs).values({
    dedupeKey: `telegram:booking-reminder:${bookingId}`,
    type: "booking_reminder",
    bookingId,
    payload: JSON.stringify({ ...reminderPayload, bookingId }),
    runAt,
    status: "scheduled",
    attempts: 0,
    maxAttempts: 5,
    createdAt: new Date("2026-08-13T00:00:00.000Z"),
    updatedAt: new Date("2026-08-13T00:00:00.000Z"),
  });
}

describe("durable Telegram appointment reminders", () => {
  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("test database unavailable");
    await db.delete(automationJobs);
    await db.delete(customerProfiles);
    await db.delete(bookings);
    sendApproval.mockClear();
    sendReminder.mockReset();
    sendReminder.mockResolvedValue({ delivered: true, duplicate: false, reason: "sent" });
  });

  it("processes a due reminder once and persists its sent state", async () => {
    const now = Date.parse("2026-08-13T15:30:00.000Z");
    await insertReminder(new Date(now));

    const first = await processDueTelegramReminders(now);
    const second = await processDueTelegramReminders(now + 60_000);
    const db = await getDb();
    const rows = db ? await db.select().from(automationJobs) : [];

    expect(first.processed).toBe(1);
    expect(second.processed).toBe(0);
    expect(sendReminder).toHaveBeenCalledTimes(1);
    expect(rows[0]).toMatchObject({ status: "sent", attempts: 1 });
  });

  it("reschedules a failed delivery with backoff and succeeds on retry", async () => {
    const now = Date.parse("2026-08-13T15:30:00.000Z");
    await insertReminder(new Date(now));
    sendReminder
      .mockResolvedValueOnce({ delivered: false, duplicate: false, reason: "telegram_delivery_failed" })
      .mockResolvedValueOnce({ delivered: true, duplicate: false, reason: "sent" });

    const first = await processDueTelegramReminders(now);
    const db = await getDb();
    const [queued] = db ? await db.select().from(automationJobs) : [];
    const second = await processDueTelegramReminders(queued!.runAt.getTime());
    const [sent] = db ? await db.select().from(automationJobs) : [];

    expect(first.processed).toBe(0);
    expect(queued).toMatchObject({ status: "scheduled", attempts: 1, lastError: "telegram_delivery_failed" });
    expect(queued?.runAt.getTime()).toBe(now + 60_000);
    expect(second.processed).toBe(1);
    expect(sent).toMatchObject({ status: "sent", attempts: 2 });
    expect(sendReminder).toHaveBeenCalledTimes(2);
  });

  it("uses stored booking and Telegram profile data when approving and scheduling notifications", async () => {
    const db = await getDb();
    if (!db) throw new Error("test database unavailable");
    const now = new Date(Math.floor(Date.now() / 1000) * 1000);
    const appointmentAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    await db.insert(bookings).values({
      publicId: "BC-AUTOMATION-001",
      customerUserId: 42,
      customerName: "Stored Customer",
      salonName: "Stored Salon",
      serviceName: "Stored Haircut",
      staffName: "Stored Stylist",
      appointmentAt,
      appointmentLabel: "In two days at 10:00",
      customerNote: null,
      managerNote: null,
      status: "pending",
      contactChannel: "telegram",
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(customerProfiles).values({
      userId: 42,
      telegramChatId: "stored-chat-123",
      reminderStatus: "not_scheduled",
      createdAt: now,
      updatedAt: now,
    });

    const result = await decideBooking({
      bookingId: "BC-AUTOMATION-001",
      status: "approved",
      managerNote: "Confirmed by manager",
    });
    const [booking] = await db.select().from(bookings);
    const jobs = await db.select().from(automationJobs);
    const approvalJob = jobs.find((job) => job.type === "booking_approval");
    const reminderJob = jobs.find((job) => job.type === "booking_reminder");

    expect(booking).toMatchObject({ status: "approved", managerNote: "Confirmed by manager" });
    expect(result.notification.delivered).toBe(true);
    expect(approvalJob).toMatchObject({ status: "sent", bookingId: "BC-AUTOMATION-001" });
    expect(reminderJob).toMatchObject({ status: "scheduled", bookingId: "BC-AUTOMATION-001" });
    expect(JSON.parse(reminderJob!.payload)).toMatchObject({
      customerName: "Stored Customer",
      salonName: "Stored Salon",
      serviceName: "Stored Haircut",
      staffName: "Stored Stylist",
      chatId: "stored-chat-123",
      appointmentAtISO: appointmentAt.toISOString(),
    });
  });

  it("does not send reminders after the appointment has started", async () => {
    const now = Date.parse("2026-08-14T16:00:00.000Z");
    await insertReminder(new Date(now - 1));

    const result = await processDueTelegramReminders(now);
    const db = await getDb();
    const [row] = db ? await db.select().from(automationJobs) : [];

    expect(result.processed).toBe(0);
    expect(sendReminder).not.toHaveBeenCalled();
    expect(row).toMatchObject({ status: "cancelled", lastError: "appointment_already_started" });
  });
});
