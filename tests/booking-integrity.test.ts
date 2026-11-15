import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = mkdtempSync(join(tmpdir(), "salon-integrity-"));
vi.stubEnv("DATABASE_URL", `file:${join(dir, "test.db")}`);
afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
  vi.unstubAllEnvs();
});
import { createBookingRequest, decideBooking } from "../server/bookings";
import { getDb } from "../server/db";
import { bookings, customerProfiles, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

beforeAll(async () => {
  const db = (await getDb())!;
  await db
    .insert(users)
    .values({
      id: 1,
      openId: "test-booking-user",
      name: "Real client",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
});
const booking = {
  customerUserId: 1,
  customerName: "Real client",
  salonName: "Real salon",
  serviceName: "Haircut",
  staffName: "Real staff",
  appointmentAtISO: "2030-01-01T10:00:00.000Z",
  appointmentLabel: "Jan 1, 12:00",
};
describe("stored booking integrity", () => {
  it("creates unique identifiers and saves the booking with its profile", async () => {
    const first = await createBookingRequest(booking);
    const second = await createBookingRequest(booking);
    expect(first.publicId).not.toBe(second.publicId);
    const db = (await getDb())!;
    const [profile] = await db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, 1));
    expect(profile.lastAppointmentId).toBe(second.publicId);
  });
  it("rejects past appointments before writing any booking", async () => {
    await expect(
      createBookingRequest({
        ...booking,
        appointmentAtISO: "2020-01-01T10:00:00.000Z",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("persists a decision once and refuses repeated or missing decisions", async () => {
    const created = await createBookingRequest(booking);
    const input = {
      ...booking,
      bookingId: created.publicId,
      appointmentAt: "forged label",
      customerName: "Forged name",
      status: "rejected" as const,
    };
    await decideBooking(input);
    await expect(decideBooking(input)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(
      decideBooking({ ...input, bookingId: "missing" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const db = (await getDb())!;
    const [saved] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.publicId, created.publicId));
    expect(saved.customerName).toBe("Real client");
    expect(saved.status).toBe("rejected");
  });
});
