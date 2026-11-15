import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocols = Array.isArray(forwardedProto) ? forwardedProto : (forwardedProto ?? "").split(",");
  return protocols.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(req: Request): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // Host-only by default. Never infer a shared parent domain on multi-tenant hosts.
  const configured = process.env.SESSION_COOKIE_DOMAIN?.trim();
  const host = req.hostname ?? "";
  const domainName = configured?.replace(/^\./, "");
  const domain = domainName && (host === domainName || host.endsWith(`.${domainName}`)) ? configured : undefined;
  const secure = isSecureRequest(req);
  return { domain, httpOnly: true, path: "/", sameSite: secure ? "none" : "lax", secure };
}
