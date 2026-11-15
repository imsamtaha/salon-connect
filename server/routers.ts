import { z } from "zod";

import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { createBookingRequest, decideBooking, getLatestBooking, listBookings } from "./bookings";
import { getConversationFeed } from "./customer-activity";
import { getManagerDashboardSnapshot } from "./dashboard";
import { loginLocalUser, registerLocalUser, sessionNameFor } from "./local-auth";
import { getReminderState } from "./reminders";

const bookingDecisionInput = z.object({
  bookingId: z.string().trim().min(1).max(200),
  customerUserId: z.number().int().positive().optional(),
  chatId: z.string().optional(),
  customerName: z.string().trim().min(1).max(200),
  salonName: z.string().trim().min(1).max(200),
  serviceName: z.string().trim().min(1).max(200),
  appointmentAt: z.string().trim().min(1).max(200),
  appointmentAtISO: z.string().datetime(),
  staffName: z.string().trim().min(1).max(200),
  managerNote: z.string().trim().max(300).optional(),
});

async function issueSession(opts: { user: { openId: string; name: string | null; email: string | null }; ctx: { req: any; res: any } }) {
  const sessionToken = await sdk.createSessionToken(opts.user.openId, {
    name: sessionNameFor(opts.user),
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(opts.ctx.req);
  opts.ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
  return {
    success: true as const,
    sessionToken,
    user: {
      openId: opts.user.openId,
      name: opts.user.name,
      email: opts.user.email,
    },
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user ? {
      id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, role: ctx.user.role,
    } : null),
    register: publicProcedure
      .input(z.object({
        name: z.string().trim().min(1).max(200),
        email: z.string().email(),
        password: z.string().min(6),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await registerLocalUser(input);
        return issueSession({ user, ctx });
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await loginLocalUser(input);
        return issueSession({ user, ctx });
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("manus_session", { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    overview: adminProcedure.query(() => getManagerDashboardSnapshot()),
  }),
  bookings: router({
    activity: protectedProcedure.query(({ ctx }) => getLatestBooking(ctx.user.id)),
    queue: adminProcedure.query(() => listBookings()),
    create: protectedProcedure
      .input(z.object({
        customerName: z.string().trim().min(1).max(200).optional(),
        salonName: z.string().trim().min(1).max(200).optional(),
        serviceName: z.string().trim().min(1).max(200),
        staffName: z.string().trim().min(1).max(200),
        appointmentAtISO: z.string().datetime(),
        appointmentLabel: z.string().trim().min(1).max(200),
        customerNote: z.string().trim().max(2000).optional(),
        contactChannel: z.enum(["telegram", "whatsapp", "direct"]).optional(),
      }))
      .mutation(({ ctx, input }) => createBookingRequest({
        ...input,
        customerUserId: ctx.user?.id,
        customerName: ctx.user?.name?.trim() || input.customerName || "عميلة",
      })),
    approve: adminProcedure
      .input(bookingDecisionInput)
      .mutation(({ input }) => decideBooking({ ...input, status: "approved" })),
    reject: adminProcedure
      .input(bookingDecisionInput)
      .mutation(({ input }) => decideBooking({ ...input, status: "rejected" })),
    reminderState: adminProcedure.query(() => getReminderState()),
  }),
  conversations: router({
    feed: protectedProcedure.query(({ ctx }) => getConversationFeed(ctx.user.id, ctx.user.role)),
  }),
});

export type AppRouter = typeof appRouter;

