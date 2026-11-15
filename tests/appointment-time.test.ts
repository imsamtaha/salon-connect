import { expect, it } from "vitest";
import { salonAppointmentISO, salonDateOptions } from "../shared/appointments";
it("converts Beirut booking hours correctly in winter and summer", () => {
  expect(salonAppointmentISO("2026-11-16", "10:00")).toBe("2026-11-16T08:00:00.000Z");
  expect(salonAppointmentISO("2026-08-16", "10:00")).toBe("2026-08-16T07:00:00.000Z");
});
it("offers future calendar days based on Beirut rather than the server date", () => {
  const days = salonDateOptions(new Date("2026-11-15T23:30:00.000Z"), "en-GB");
  expect(days).toHaveLength(7);
  expect(days[0].id).toBe("2026-11-17");
  expect(days[6].id).toBe("2026-11-23");
});
