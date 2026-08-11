import { beforeEach, describe, expect, it, vi } from "vitest";

const sendReminder = vi.fn(async () => ({ delivered: true, duplicate: false, reason: "sent" as const }));
vi.mock("../server/telegram", () => ({ sendBookingReminderNotification: sendReminder }));

const { processDueTelegramReminders, registerApprovedBooking } = await import("../server/reminders");

describe("Telegram appointment reminders", () => {
  beforeEach(() => sendReminder.mockClear());

  it("processes an approved booking once at the 24-hour mark", async () => {
    const now = Date.parse("2026-08-13T15:30:00.000Z");
    registerApprovedBooking({
      bookingId: "test-reminder-1",
      customerName: "Test Customer",
      salonName: "Test Salon",
      serviceName: "Haircut",
      appointmentAtISO: "2026-08-14T15:30:00.000Z",
      appointmentAtLabel: "Tomorrow at 6:30 PM",
      staffName: "Sara",
    });

    const first = await processDueTelegramReminders(now);
    const second = await processDueTelegramReminders(now + 60_000);

    expect(first.processed).toBe(1);
    expect(second.processed).toBe(0);
    expect(sendReminder).toHaveBeenCalledTimes(1);
  });
});
