# JUST beauty UI and backend upgrade

The booking screen offers the next seven days with Beirut winter/summer time conversion and no customer-side approval simulation. The overview uses saved bookings, role-specific screens, search, status filters, pull-to-refresh, and a current Beirut date. It supports English/Arabic and light/dark appearance. Static client conversations, revenue claims, and operational status claims have been removed from the overview.

## Runtime configuration

Keep the existing Expo + Express + SQLite/libSQL deployment. This change does not migrate customer data to Supabase or create a new Site.

- Set `JWT_SECRET` to a unique secret of at least 32 characters before starting production. Startup fails if it is missing or too short.
- Set `ALLOWED_ORIGINS` to the exact HTTPS frontend origins, comma separated. `EXPO_WEB_PREVIEW_URL` and `EXPO_PACKAGER_PROXY_URL` are also accepted. Cross-origin requests from other browsers are rejected, including mutations. Native requests without Origin continue to use bearer authentication.
- Session cookies are host-only by default. Configure `SESSION_COOKIE_DOMAIN` only for subdomains you control; HTTP development uses SameSite=Lax.
- Set `SCHEDULER_SECRET` before configuring reminder callbacks. The built-in heartbeat registration includes it in the callback body. A custom scheduler may send `Authorization: Bearer <secret>` instead. Recreate any existing heartbeat task so it receives the authenticated payload.
- Set `SALON_TIMEZONE` to the salon's IANA time zone (defaults to Asia/Beirut). The overview displays Beirut times.
- Demo seeding is now opt-in (`ENABLE_DEMO_SEED=true`) and disabled in production. Existing data is preserved. Confirm an existing trusted manager account is available before launch. Never use the bundled demo accounts for production; rotate or remove any previously seeded credentials.
- Keep a durable database volume and backups. Reminder tracking remains process-local in the existing implementation; a process restart loses pending reminder tracking. Durable reminder jobs need a follow-up migration before relying on unattended reminders.

## Access and persistence

Manager dashboard, booking queue, approvals, rejections and reminder state require the admin role on the server. Booking creation/activity and conversation feed require a signed-in user. Session inspection only returns safe identity fields. Creation saves booking, customer profile and conversation in a transaction, with random unique public identifiers. Past appointments are rejected. Decisions atomically transition pending bookings once; notifications and automation use stored booking and customer profile values rather than client-supplied identity details.

## Validation

Run `pnpm check`, `pnpm exec vitest run --exclude tests/telegram.credentials.test.ts`, `pnpm build`, and `pnpm exec expo export --platform web`.

The separate Telegram credential test makes a real external request and requires TELEGRAM_BOT_TOKEN. Local tests cannot verify a deployed host, actual Telegram delivery, or production database configuration.

Browser visual/interaction QA was attempted but the local Chromium process could not start under the runtime socket restrictions. Typechecking, unit/integration tests and web export are separate checks, not a substitute for production browser verification.
