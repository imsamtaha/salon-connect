import { describe, expect, it } from "vitest";

describe("Telegram credentials", () => {
  it("validates the configured bot token with getMe", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN is required for this credential validation test");
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    expect(response.ok).toBe(true);
    const payload = (await response.json()) as { ok?: boolean };
    expect(payload.ok).toBe(true);
  }, 15000);
});
