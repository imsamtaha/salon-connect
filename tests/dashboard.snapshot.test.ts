import { describe, expect, it } from "vitest";

import { createDashboardSnapshot, type DashboardProfileRecord } from "../server/dashboard";

const now = new Date("2026-08-13T10:00:00.000Z");

function record(overrides: Partial<DashboardProfileRecord> = {}): DashboardProfileRecord {
  return {
    profileId: 1,
    userId: 1,
    clientName: "Maya K.",
    phone: null,
    telegramChatId: "123",
    note: null,
    appointmentId: "booking-1",
    appointmentStatus: "approved",
    appointmentAt: new Date("2026-08-13T12:30:00.000Z"),
    updatedAt: new Date("2026-08-13T09:00:00.000Z"),
    ...overrides,
  };
}

describe("createDashboardSnapshot", () => {
  it("returns a truthful empty snapshot when no customer records have appointments", () => {
    const snapshot = createDashboardSnapshot([record({ appointmentId: null, appointmentAt: null })], now);

    expect(snapshot.metrics).toMatchObject({ appointmentsToday: 0, confirmed: 0, pending: 0, estimatedRevenue: null });
    expect(snapshot.rows).toEqual([]);
  });

  it("summarises today's appointment statuses and preserves a customer-note flag", () => {
    const snapshot = createDashboardSnapshot([
      record({ note: "Sensitive skin", appointmentStatus: "approved" }),
      record({ profileId: 2, appointmentId: "booking-2", appointmentStatus: "pending", appointmentAt: new Date("2026-08-13T16:00:00.000Z") }),
      record({ profileId: 3, appointmentId: "booking-3", appointmentAt: new Date("2026-08-14T10:00:00.000Z") }),
    ], now);

    expect(snapshot.metrics).toMatchObject({ appointmentsToday: 2, confirmed: 1, pending: 1, unpricedAppointments: 1 });
    expect(snapshot.rows[0]).toMatchObject({ contactChannel: "Telegram", hasCustomerNote: true });
  });
});
