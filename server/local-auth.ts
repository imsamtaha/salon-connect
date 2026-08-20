import { TRPCError } from "@trpc/server";

import { ENV } from "./_core/env";
import { getUserByEmail, getUserByOpenId, hashPassword, upsertUser, verifyPassword } from "./db";

export type LocalAuthInput = {
  name?: string;
  email: string;
  password: string;
  phone?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function localOpenId(email: string) {
  return `local:${normalizeEmail(email)}`;
}

export async function registerLocalUser(input: LocalAuthInput) {
  const email = normalizeEmail(input.email);
  if (!email.includes("@")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A valid email is required" });
  }
  if (input.password.length < 6) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Password must be at least 6 characters" });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
  }

  const openId = localOpenId(email);
  await upsertUser({
    openId,
    name: input.name?.trim() || email.split("@")[0],
    email,
    loginMethod: "password",
    passwordHash: hashPassword(input.password),
    role: "user",
    lastSignedIn: new Date(),
  });

  const user = await getUserByOpenId(openId);
  if (!user) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create the account" });
  }
  return user;
}

export async function loginLocalUser(input: Pick<LocalAuthInput, "email" | "password">) {
  const email = normalizeEmail(input.email);
  const user = await getUserByEmail(email);
  if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
  }

  await upsertUser({
    openId: user.openId,
    lastSignedIn: new Date(),
  });

  return user;
}

export function sessionNameFor(user: { name: string | null; email: string | null; openId: string }) {
  return user.name?.trim() || user.email?.trim() || user.openId;
}

export function localAppId() {
  return ENV.appId || "salon-connect-local";
}
