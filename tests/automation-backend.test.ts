import { describe, expect, it } from "vitest";

import { reminderRunAt } from "../server/automation";
import { isValidAutomationToken } from "../server/_core/scheduled-auth";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("durable booking automation helpers", () => {
  it("schedules reminders 24 hours before the appointment", () => {
    const now = Date.parse("2026-11-16T10:00:00.000Z");
    const appointment = now + 3 * DAY_MS;

    expect(reminderRunAt(appointment, now)).toBe(appointment - DAY_MS);
  });

  it("queues a reminder immediately when approval is within 24 hours", () => {
    const now = Date.parse("2026-11-16T10:00:00.000Z");
    const appointment = now + 4 * 60 * 60 * 1000;

    expect(reminderRunAt(appointment, now)).toBe(now);
  });

  it("does not schedule reminders for invalid or past appointments", () => {
    const now = Date.parse("2026-11-16T10:00:00.000Z");

    expect(reminderRunAt(Number.NaN, now)).toBeNull();
    expect(reminderRunAt(now, now)).toBeNull();
    expect(reminderRunAt(now - 1, now)).toBeNull();
  });
});

describe("scheduled automation callback authentication", () => {
  it("accepts the configured secret and rejects missing, mismatched, or unconfigured secrets", () => {
    expect(isValidAutomationToken("a-long-random-secret", "a-long-random-secret")).toBe(true);
    expect(isValidAutomationToken("a-long-random-secret", "wrong-secret")).toBe(false);
    expect(isValidAutomationToken("a-long-random-secret", undefined)).toBe(false);
    expect(isValidAutomationToken(undefined, "a-long-random-secret")).toBe(false);
  });
});
