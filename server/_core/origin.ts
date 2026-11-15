import type { Request } from "express";

/** Cross-origin web clients must be explicitly configured. Native requests have no Origin. */
export function isAllowedOrigin(
  req: Pick<Request, "headers" | "protocol" | "get">,
) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const configured = [
    process.env.EXPO_WEB_PREVIEW_URL,
    process.env.EXPO_PACKAGER_PROXY_URL,
    ...(process.env.ALLOWED_ORIGINS ?? "").split(","),
  ].filter(Boolean);
  if (process.env.NODE_ENV !== "production")
    configured.push("http://localhost:8081", "http://localhost:8082");
  const host = req.get("host");
  if (host) configured.push(`${req.protocol}://${host}`);
  return configured.some((value) => {
    try {
      return new URL(value!.trim()).origin === origin;
    } catch {
      return false;
    }
  });
}
