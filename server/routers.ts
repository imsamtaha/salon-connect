import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { sendBookingApprovalNotification } from "./telegram";

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
  bookings: router({
    approve: publicProcedure
      .input(z.object({
        bookingId: z.string().min(1),
        chatId: z.string().optional(),
        customerName: z.string().min(1),
        salonName: z.string().min(1),
        serviceName: z.string().min(1),
        appointmentAt: z.string().min(1),
        staffName: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const notification = await sendBookingApprovalNotification(input);
        return { bookingId: input.bookingId, status: "approved" as const, notification };
      }),
  }),
});

export type AppRouter = typeof appRouter;
