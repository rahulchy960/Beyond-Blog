import { auth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { db } from "@/server/db";

export const createTRPCContext = async () => {
  const { userId } = await auth();

  return {
    db,
    userId,
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

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const dbUser = await ctx.db.user.findUnique({
    where: { clerkUserId: ctx.userId },
  });

  if (!dbUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User does not exist in database. Sign in again to sync your profile.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      dbUser,
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.dbUser.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin role required" });
  }

  return next({
    ctx,
  });
});
