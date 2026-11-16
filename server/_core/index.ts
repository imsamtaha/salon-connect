import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { isValidAutomationToken } from "./scheduled-auth";
import { ENV } from "./env";
import { getDb } from "../db";
import { ensureReminderHeartbeat, processDueTelegramReminders, startAutomationWorker } from "../reminders";
import { seedIfEmpty } from "../seed";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", async (_req, res) => {
    const db = await getDb();
    res.json({ ok: true, database: Boolean(db), timestamp: Date.now() });
  });

  app.post("/api/scheduled/telegram-reminders", async (_req, res) => {
    if (!ENV.automationWebhookSecret) {
      res.status(503).json({ ok: false, error: "automation_secret_not_configured" });
      return;
    }
    if (!isValidAutomationToken(ENV.automationWebhookSecret, _req.body?.token)) {
      res.status(401).json({ ok: false, error: "unauthorized" });
      return;
    }

    try {
      const result = await processDueTelegramReminders();
      res.json({ ok: true, ...result });
    } catch (error) {
      console.error("[telegram-reminders] failed", error);
      res.status(500).json({ ok: false, error: "reminder_processing_failed" });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  const db = await getDb();
  if (db) {
    const seed = await seedIfEmpty();
    console.log(`[database] ready (${seed.reason})`);
  } else {
    console.warn("[database] unavailable");
  }

  startAutomationWorker();
  if (ENV.automationWebhookSecret) {
    void ensureReminderHeartbeat().catch((error) => {
      console.warn("[automation-worker] heartbeat registration unavailable", error);
    });
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
