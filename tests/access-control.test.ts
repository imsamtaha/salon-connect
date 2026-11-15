import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function context(role?: "user" | "admin"): TrpcContext {
  return {
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user: role
      ? {
          id: 99,
          openId: "test",
          name: "Test",
          email: "test@example.com",
          role,
          passwordHash: "private-hash",
          loginMethod: "password",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
  };
}

describe("salon API authorization", () => {
  it.each([undefined, "user"] as const)(
    "denies manager data to %s",
    async (role) => {
      const caller = appRouter.createCaller(context(role));
      await expect(caller.dashboard.overview()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(caller.bookings.queue()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(caller.bookings.reminderState()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      const input = {
        bookingId: "BC-1",
        customerName: "Test",
        salonName: "Test",
        serviceName: "Cut",
        appointmentAt: "tomorrow",
        appointmentAtISO: "2030-01-01T10:00:00.000Z",
        staffName: "Test",
      };
      await expect(caller.bookings.approve(input)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(caller.bookings.reject(input)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    },
  );
  it("requires a session for conversations and booking activity", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.conversations.feed()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(caller.bookings.activity()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      caller.bookings.create({
        serviceName: "Cut",
        staffName: "Test",
        appointmentAtISO: "2030-01-01T10:00:00.000Z",
        appointmentLabel: "tomorrow",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("never returns password hashes in the session response", async () => {
    const me = await appRouter.createCaller(context("admin")).auth.me();
    expect(me).toEqual({
      id: 99,
      name: "Test",
      email: "test@example.com",
      role: "admin",
    });
    expect(await appRouter.createCaller(context()).auth.me()).toBeNull();
  });
});
