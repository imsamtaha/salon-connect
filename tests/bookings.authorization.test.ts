import { describe, expect, it } from "vitest";

import type { TrpcContext } from "../server/_core/context";
import { appRouter } from "../server/routers";

function makeContext(role: "user" | "admin" | null): TrpcContext {
  const user = role === null ? null : {
    id: 1,
    openId: `local:${role}@example.com`,
    email: `${role}@example.com`,
    name: role === "admin" ? "Manager" : "Customer",
    loginMethod: "password",
    passwordHash: null,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("manager booking authorization", () => {
  it("blocks anonymous and customer accounts from reading the manager queue", async () => {
    for (const role of [null, "user"] as const) {
      const caller = appRouter.createCaller(makeContext(role));
      await expect(caller.bookings.queue()).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("blocks customers from approving bookings or reading automation metrics", async () => {
    const caller = appRouter.createCaller(makeContext("user"));
    const input = {
      bookingId: "BC-0001",
    };

    await expect(caller.bookings.approve(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.bookings.reminderState()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
