import { afterEach, expect, it, vi } from "vitest";
import { getSessionCookieOptions } from "../server/_core/cookies";
afterEach(() => vi.unstubAllEnvs());
const request = (hostname: string, protocol = "https") =>
  ({ hostname, protocol, headers: {} }) as any;
it("uses host-only cookies and supports local HTTP sign-in", () => {
  expect(
    getSessionCookieOptions(request("tenant.shared.example")),
  ).toMatchObject({
    domain: undefined,
    secure: true,
    sameSite: "none",
    httpOnly: true,
  });
  expect(getSessionCookieOptions(request("localhost", "http"))).toMatchObject({
    domain: undefined,
    secure: false,
    sameSite: "lax",
  });
});
it("only shares cookies with an explicitly configured matching domain", () => {
  vi.stubEnv("SESSION_COOKIE_DOMAIN", ".salon.example");
  expect(getSessionCookieOptions(request("api.salon.example")).domain).toBe(
    ".salon.example",
  );
  expect(
    getSessionCookieOptions(request("api.other.example")).domain,
  ).toBeUndefined();
});
