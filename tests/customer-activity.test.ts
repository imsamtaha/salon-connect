import { describe, expect, it } from "vitest";

import { createBookingActivitySnapshot, createConversationFeed } from "../server/customer-activity";

describe("createBookingActivitySnapshot", () => {
  it("returns no appointment when the customer record has never booked", () => {
    expect(createBookingActivitySnapshot({
      appointmentId: null,
      appointmentStatus: null,
      appointmentAt: null,
      preferredStaff: "Layan",
      notes: null,
    })).toEqual({ appointment: null });
  });

  it("preserves live booking status and a customer-note flag", () => {
    const snapshot = createBookingActivitySnapshot({
      appointmentId: "BC-0148",
      appointmentStatus: "pending",
      appointmentAt: new Date("2026-08-15T07:00:00.000Z"),
      preferredStaff: "ليان",
      notes: "أفضّل غرفة هادئة",
    });

    expect(snapshot.appointment).toMatchObject({
      id: "BC-0148",
      status: "pending",
      staffName: "ليان",
      hasCustomerNote: true,
    });
  });
});

describe("createConversationFeed", () => {
  it("returns an empty feed when no conversations exist", () => {
    expect(createConversationFeed([])).toEqual({ threads: [] });
  });

  it("maps salon name, preview, and an initial for the conversation list", () => {
    const feed = createConversationFeed([{
      id: 12,
      title: "Glow Studio",
      salonName: "Glow Studio",
      preview: "Your request is waiting for approval.",
      updatedAt: new Date("2026-08-15T09:30:00.000Z"),
    }]);

    expect(feed.threads[0]).toMatchObject({
      id: "12",
      name: "Glow Studio",
      preview: "Your request is waiting for approval.",
      initial: "G",
    });
  });
});
