import { describe, expect, it } from "vitest";

import { nextBookingPublicId, toQueueItem, type BookingRecord } from "../server/bookings";

describe("booking backend helpers", () => {
  it("assigns sequential public booking ids", () => {
    expect(nextBookingPublicId(0)).toBe("BC-0001");
    expect(nextBookingPublicId(12)).toBe("BC-0013");
  });

  it("maps a stored booking into a manager queue row", () => {
    const record: BookingRecord = {
      id: 1,
      publicId: "BC-0001",
      customerUserId: 4,
      customerName: "نورة أحمد",
      salonName: "JUST beauty",
      serviceName: "تنظيف بشرة عميق",
      staffName: "ليان",
      appointmentAt: new Date("2026-08-21T07:00:00.000Z"),
      appointmentLabel: "غداً · 21 أغسطس · 10:00 ص",
      customerNote: "غرفة هادئة",
      managerNote: null,
      status: "pending",
      contactChannel: "telegram",
      createdAt: new Date("2026-08-20T09:00:00.000Z"),
      updatedAt: new Date("2026-08-20T09:00:00.000Z"),
    };

    expect(toQueueItem(record)).toMatchObject({
      id: "BC-0001",
      customer: "نورة أحمد",
      service: "تنظيف بشرة عميق",
      status: "pending",
      note: "غرفة هادئة",
    });
  });
});
