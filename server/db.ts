import { createClient, type Client } from "@libsql/client";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { SQLITE_SCHEMA_STATEMENTS } from "./sqlite-schema";

export type AppDatabase = ReturnType<typeof drizzle>;

let _db: AppDatabase | null = null;
let _client: Client | null = null;

export function resolveDatabaseUrl() {
  const configured = process.env.DATABASE_URL?.trim();
  if (configured && !configured.startsWith("mysql")) {
    return configured;
  }
  return `file:${resolve(process.cwd(), "data/salon-connect.db")}`;
}

async function ensureSchema(client: Client) {
  for (const statement of SQLITE_SCHEMA_STATEMENTS) {
    await client.execute(statement);
  }
}

export async function getDb() {
  if (_db) return _db;

  try {
    const url = resolveDatabaseUrl();
    if (url.startsWith("file:")) {
      const filePath = url.replace(/^file:/, "");
      mkdirSync(dirname(filePath), { recursive: true });
    }

    _client = createClient({ url });
    await ensureSchema(_client);
    _db = drizzle(_client);
    return _db;
  } catch (error) {
    console.warn("[Database] Failed to connect:", error);
    _db = null;
    _client = null;
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const previous = Buffer.from(hash, "hex");
  if (previous.length !== next.length) return false;
  return timingSafeEqual(previous, next);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = {
    openId: user.openId,
    createdAt: user.createdAt ?? new Date(),
    updatedAt: new Date(),
    lastSignedIn: user.lastSignedIn ?? new Date(),
  };
  const updateSet: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  const assign = <K extends keyof InsertUser>(field: K) => {
    const value = user[field];
    if (value === undefined) return;
    values[field] = value;
    updateSet[field] = value;
  };

  assign("name");
  assign("email");
  assign("loginMethod");
  assign("passwordHash");
  assign("lastSignedIn");

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: updateSet,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
