import { auth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { AdminRole } from "@prisma/client";
import { db } from "@/server/db";

export const createTRPCContext = async () => {
  const { userId, sessionId } = await auth();

  return {
    db,
    userId,
    sessionId,
    isAuthenticated: Boolean(userId),
  };
};

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign-in required for admin procedures.",
    });
  }

  const adminUser = await ctx.db.adminUser.findUnique({
    where: { clerkUserId: ctx.userId },
  });

  if (!adminUser || !adminUser.isActive || adminUser.role !== AdminRole.OWNER) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the configured Beyond Blog admin can perform this action.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      adminUser,
    },
  });
});
