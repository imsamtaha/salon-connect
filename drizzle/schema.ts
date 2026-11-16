import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  passwordHash: text("passwordHash"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const customerProfiles = sqliteTable("customer_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique(),
  phone: text("phone"),
  telegramChatId: text("telegramChatId"),
  preferredStaff: text("preferredStaff"),
  notes: text("notes"),
  lastAppointmentId: text("lastAppointmentId"),
  lastAppointmentStatus: text("lastAppointmentStatus", {
    enum: ["pending", "approved", "rejected", "rescheduled", "cancelled"],
  }),
  lastAppointmentAt: integer("lastAppointmentAt", { mode: "timestamp" }),
  lastReminderAt: integer("lastReminderAt", { mode: "timestamp" }),
  reminderStatus: text("reminderStatus", {
    enum: ["not_scheduled", "scheduled", "sent", "cancelled", "failed"],
  }).default("not_scheduled").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicId: text("publicId").notNull().unique(),
  customerUserId: integer("customerUserId"),
  customerName: text("customerName").notNull(),
  salonName: text("salonName").notNull(),
  serviceName: text("serviceName").notNull(),
  staffName: text("staffName").notNull(),
  appointmentAt: integer("appointmentAt", { mode: "timestamp" }).notNull(),
  appointmentLabel: text("appointmentLabel").notNull(),
  customerNote: text("customerNote"),
  managerNote: text("managerNote"),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "rescheduled", "cancelled"],
  }).default("pending").notNull(),
  contactChannel: text("contactChannel", {
    enum: ["telegram", "whatsapp", "direct"],
  }).default("telegram").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const automationJobs = sqliteTable("automation_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dedupeKey: text("dedupeKey").notNull().unique(),
  type: text("type", { enum: ["booking_approval", "booking_reminder"] }).notNull(),
  bookingId: text("bookingId").notNull(),
  payload: text("payload").notNull(),
  runAt: integer("runAt", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["scheduled", "processing", "sent", "failed", "cancelled"] })
    .default("scheduled")
    .notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("maxAttempts").default(5).notNull(),
  lastError: text("lastError"),
  lastAttemptAt: integer("lastAttemptAt", { mode: "timestamp" }),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
}, (table) => [
  index("automation_jobs_due_idx").on(table.status, table.runAt),
  index("automation_jobs_booking_idx").on(table.bookingId, table.type, table.status),
]);

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  salonName: text("salonName"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversationId").notNull(),
  userId: integer("userId").notNull(),
  sender: text("sender", { enum: ["customer", "center"] }).notNull(),
  body: text("body").notNull(),
  read: integer("read", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type AutomationJob = typeof automationJobs.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
