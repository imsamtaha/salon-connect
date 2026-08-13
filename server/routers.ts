import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getManagerDashboardSnapshot } from "./dashboard";
import { sendBookingApprovalNotification } from "./telegram";
import { getReminderState } from "./reminders";
import { runApprovedAppointmentAutomation } from "./automation";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("manus_session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    overview: adminProcedure.query(() => getManagerDashboardSnapshot()),
  }),
  bookings: router({
    approve: publicProcedure
      .input(z.object({
        bookingId: z.string().min(1), customerUserId: z.number().int().positive().optional(), chatId: z.string().optional(), customerName: z.string().min(1), salonName: z.string().min(1), serviceName: z.string().min(1), appointmentAt: z.string().min(1), appointmentAtISO: z.string().datetime(), staffName: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const notification = await sendBookingApprovalNotification(input);
        const automation = await runApprovedAppointmentAutomation(input);
        return {
          bookingId: input.bookingId,
          status: "approved" as const,
          notification,
          reminderScheduler: automation.reminderScheduler,
          customerRecordUpdated: automation.customerRecordUpdated,
          reminderAtISO: automation.snapshot.reminderAtISO,
        };
      }),
    reminderState: publicProcedure.query(() => getReminderState()),
  }),
});

export type AppRouter = typeof appRouter;
