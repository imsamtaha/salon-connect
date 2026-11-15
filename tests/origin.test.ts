import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowedOrigin } from "../server/_core/origin";

afterEach(() => vi.unstubAllEnvs());
describe("credentialed origins", () => {
  const request = (origin?: string) => ({
    headers: { origin },
    protocol: "https",
    get: (() => "salon.example.com") as any,
  });
  it("blocks an unconfigured origin and allows same-origin and native requests", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isAllowedOrigin(request("https://attacker.example"))).toBe(false);
    expect(isAllowedOrigin(request("https://salon.example.com"))).toBe(true);
    expect(isAllowedOrigin(request())).toBe(true);
    expect(isAllowedOrigin(request("http://localhost:8081"))).toBe(false);
  });
  it("matches complete configured origins rather than hostname prefixes", () => {
    vi.stubEnv("ALLOWED_ORIGINS", "https://frontend.example.com");
    expect(isAllowedOrigin(request("https://frontend.example.com"))).toBe(true);
    expect(
      isAllowedOrigin(request("https://frontend.example.com.attacker.example")),
    ).toBe(false);
  });
});
