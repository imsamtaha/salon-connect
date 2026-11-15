import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(
  resolve(process.cwd(), "app/(tabs)/index.tsx"),
  "utf8",
);

describe("live CRM request failure UI", () => {
  it("renders an accessible error state with a protected retry action", () => {
    expect(dashboardSource).toContain("function CrmRequestError");
    expect(dashboardSource).toContain('accessibilityRole="alert"');
    expect(dashboardSource).toContain("dashboardQuery.refetch()");
    expect(dashboardSource).toContain("dashboardQuery.isRefetching");
    expect(dashboardSource).toContain("retryActionDisabled");
  });

  it("routes unavailable live CRM data through the error state instead of an empty state", () => {
    expect(dashboardSource).toContain("const hasLiveRequestError");
    expect(dashboardSource).toMatch(/hasLiveRequestError\s*\?\s*\(?\s*<CrmRequestError/);
    expect(dashboardSource).toContain('retry: false');
  });
});
