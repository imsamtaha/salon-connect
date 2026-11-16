import { timingSafeEqual } from "node:crypto";

export function isValidAutomationToken(configuredToken: string | undefined, suppliedToken: unknown) {
  if (!configuredToken || typeof suppliedToken !== "string") return false;

  const expected = Buffer.from(configuredToken);
  const supplied = Buffer.from(suppliedToken);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
