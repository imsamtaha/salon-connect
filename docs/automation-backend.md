# Automation backend

Salon Connect now uses a durable SQLite-backed job queue for Telegram booking notifications. Approving a booking writes an immediate approval job and, for a future appointment, a reminder job scheduled 24 hours before the appointment. If approval happens within 24 hours of the appointment, the reminder is queued immediately. Rejecting a booking cancels any notification jobs that have not started.

## Reliability and delivery

Jobs persist across app restarts. The worker claims due jobs with an atomic status update, records each attempt, retries failures with exponential backoff (starting at one minute and capped at one hour), and marks exhausted jobs as failed. A unique deduplication key prevents the same booking event from being queued twice. Telegram is still an external service, so a crash after Telegram accepts a message but before the database records success can result in one duplicate delivery; the system provides durable at-least-once processing, not a strict exactly-once guarantee.

A local worker checks the database once per minute while the server is running. The optional scheduled callback provides an additional wake-up path for deployments that may sleep or restart. It is protected by a shared secret and never processes jobs when the secret is missing or incorrect.

The manager booking queue, approval/rejection actions, dashboard, and automation metrics require an authenticated admin account. Approval requests contain only a booking ID and an optional manager note; the server reads the appointment, customer, and Telegram chat ID from the database before it queues notifications. Customer booking creation remains public or signed-in, as appropriate.

## Setup

1. Copy `.env.example` to `.env` and set `AUTOMATION_WEBHOOK_SECRET` to a unique random value. Generate one with `openssl rand -hex 32`.
2. Set `DATABASE_URL` to a persistent SQLite file or a durable libSQL/Turso database. Avoid ephemeral filesystems in production; jobs and retry state live in this database.
3. Configure `TELEGRAM_BOT_TOKEN` and, when needed, `TELEGRAM_DEFAULT_CHAT_ID` using the existing Telegram setup. Do not commit `.env` or bot credentials.
4. Run `pnpm db:push` to create or update the SQLite schema, then start the server with `pnpm dev` or build and run it with `pnpm build && pnpm start`.

The scheduled worker callback is `POST /api/scheduled/telegram-reminders` with JSON body `{ "token": "<AUTOMATION_WEBHOOK_SECRET>" }`. The app registers or updates its one-minute heartbeat job when the server starts, if the callback secret and scheduler service settings are present. The server also has a built-in local worker, so a working scheduler integration is not required for a continuously running server.

## Operations

`bookings.reminderState` reports the number of tracked bookings, scheduled jobs, failed jobs, and whether the external heartbeat was registered in the current process. Job rows in `automation_jobs` retain the status (`scheduled`, `processing`, `sent`, `failed`, or `cancelled`), attempt count, last error, timestamps, and the deduplication key for diagnosis.

WhatsApp, inbound webhooks, and a multi-channel delivery abstraction remain out of scope; the project notes list them as later work. Add future channel-specific jobs through the same durable queue rather than putting delivery state in process memory.
