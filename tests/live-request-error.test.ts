import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const bookingsSource = readFileSync(resolve(process.cwd(), "app/(tabs)/bookings.tsx"), "utf8");
const messagesSource = readFileSync(resolve(process.cwd(), "app/(tabs)/messages.tsx"), "utf8");

describe("live bookings request failure UI", () => {
  it("renders an accessible error state with a protected retry action", () => {
    expect(bookingsSource).toContain("function BookingRequestError");
    expect(bookingsSource).toContain('accessibilityRole="alert"');
    expect(bookingsSource).toContain("bookingsQuery.refetch()");
    expect(bookingsSource).toContain("bookingsQuery.isRefetching");
    expect(bookingsSource).toContain("retryActionDisabled");
  });

  it("routes unavailable live booking data through the error state instead of an empty state", () => {
    expect(bookingsSource).toContain("const hasLiveRequestError");
    expect(bookingsSource).toContain("hasLiveRequestError ? <BookingRequestError");
    expect(bookingsSource).toContain("retry: false");
  });
});

describe("live conversations request failure UI", () => {
  it("renders an accessible error state with a protected retry action", () => {
    expect(messagesSource).toContain("function ConversationRequestError");
    expect(messagesSource).toContain('accessibilityRole="alert"');
    expect(messagesSource).toContain("conversationsQuery.refetch()");
    expect(messagesSource).toContain("conversationsQuery.isRefetching");
    expect(messagesSource).toContain("retryActionDisabled");
  });

  it("routes unavailable live conversation data through the error state instead of an empty state", () => {
    expect(messagesSource).toContain("const hasLiveRequestError");
    expect(messagesSource).toContain("hasLiveRequestError ? <ConversationRequestError");
    expect(messagesSource).toContain("retry: false");
  });
});
