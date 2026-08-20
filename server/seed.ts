import { eq } from "drizzle-orm";

import { bookings, conversations, customerProfiles, messages, users } from "../drizzle/schema";
import { getDb, hashPassword } from "./db";

export const DEMO_PASSWORD = "demo1234";

export async function seedIfEmpty() {
  const db = await getDb();
  if (!db) return { seeded: false, reason: "database_unavailable" as const };

  const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
  const existingBookings = await db.select({ id: bookings.id }).from(bookings).limit(1);
  if (existingUsers.length > 0 && existingBookings.length > 0) {
    return { seeded: false, reason: "already_present" as const };
  }

  const now = new Date();
  const passwordHash = hashPassword(DEMO_PASSWORD);

  await db.insert(users).values([
    {
      openId: "local:nadine@justbeauty.local",
      name: "نادين",
      email: "nadine@justbeauty.local",
      loginMethod: "password",
      passwordHash,
      role: "admin",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    {
      openId: "local:nora@justbeauty.local",
      name: "نورة أحمد",
      email: "nora@justbeauty.local",
      loginMethod: "password",
      passwordHash,
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    {
      openId: "local:reem@justbeauty.local",
      name: "ريم خليل",
      email: "reem@justbeauty.local",
      loginMethod: "password",
      passwordHash,
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
  ]).onConflictDoUpdate({
    target: users.openId,
    set: { passwordHash, updatedAt: now },
  });

  const nora = (await db.select().from(users).where(eq(users.email, "nora@justbeauty.local")))[0];
  const reem = (await db.select().from(users).where(eq(users.email, "reem@justbeauty.local")))[0];
  if (!nora || !reem) return { seeded: false, reason: "users_missing" as const };

  await db.insert(customerProfiles).values([
    {
      userId: nora.id,
      phone: "+96170111001",
      preferredStaff: "ليان",
      notes: "أفضّل غرفة هادئة إن أمكن.",
      lastAppointmentId: "BC-0001",
      lastAppointmentStatus: "pending",
      lastAppointmentAt: new Date("2026-08-21T07:00:00.000Z"),
      reminderStatus: "not_scheduled",
      createdAt: now,
      updatedAt: now,
    },
    {
      userId: reem.id,
      phone: "+96170111002",
      preferredStaff: "نور",
      notes: "لدي مناسبة مساءً.",
      lastAppointmentId: "BC-0002",
      lastAppointmentStatus: "pending",
      lastAppointmentAt: new Date("2026-08-22T13:00:00.000Z"),
      reminderStatus: "not_scheduled",
      createdAt: now,
      updatedAt: now,
    },
  ]).onConflictDoUpdate({
    target: customerProfiles.userId,
    set: { updatedAt: now },
  });

  if (existingBookings.length === 0) {
    await db.insert(bookings).values([
      {
        publicId: "BC-0001",
        customerUserId: nora.id,
        customerName: "نورة أحمد",
        salonName: "JUST beauty",
        serviceName: "تنظيف بشرة عميق",
        staffName: "ليان",
        appointmentAt: new Date("2026-08-21T07:00:00.000Z"),
        appointmentLabel: "غداً · 21 أغسطس · 10:00 ص",
        customerNote: "أفضّل غرفة هادئة إن أمكن.",
        managerNote: null,
        status: "pending",
        contactChannel: "telegram",
        createdAt: now,
        updatedAt: now,
      },
      {
        publicId: "BC-0002",
        customerUserId: reem.id,
        customerName: "ريم خليل",
        salonName: "JUST beauty",
        serviceName: "تسريحة ومكياج",
        staffName: "نور",
        appointmentAt: new Date("2026-08-22T13:00:00.000Z"),
        appointmentLabel: "السبت · 22 أغسطس · 4:00 م",
        customerNote: "لدي مناسبة مساءً.",
        managerNote: null,
        status: "pending",
        contactChannel: "telegram",
        createdAt: now,
        updatedAt: now,
      },
      {
        publicId: "BC-0003",
        customerUserId: nora.id,
        customerName: "سلمى عوض",
        salonName: "JUST beauty",
        serviceName: "مانيكير وبديكير",
        staffName: "سارة",
        appointmentAt: new Date("2026-08-20T15:30:00.000Z"),
        appointmentLabel: "اليوم · 20 أغسطس · 6:30 م",
        customerNote: null,
        managerNote: "تم تأكيد الغرفة 2.",
        status: "approved",
        contactChannel: "direct",
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }

  const existingConversations = await db.select({ id: conversations.id }).from(conversations).limit(1);
  if (existingConversations.length === 0) {
    const [thread] = await db.insert(conversations).values({
      userId: nora.id,
      title: "تنظيف بشرة عميق",
      salonName: "JUST beauty",
      createdAt: now,
      updatedAt: now,
    }).returning({ id: conversations.id });

    if (thread) {
      await db.insert(messages).values([
        {
          conversationId: thread.id,
          userId: nora.id,
          sender: "customer",
          body: "أفضّل غرفة هادئة إن أمكن.",
          read: true,
          createdAt: now,
        },
        {
          conversationId: thread.id,
          userId: nora.id,
          sender: "center",
          body: "تم استلام طلبك. سنراجع الموعد ونؤكده قريباً.",
          read: false,
          createdAt: now,
        },
      ]);
    }
  }

  return { seeded: true as const, reason: "inserted" as const };
}
