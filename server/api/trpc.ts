import { auth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { OWNER_ADMIN_ROLE } from "@/lib/auth/constants";
import { getAllowedAdminIds, isAllowedAdmin } from "@/lib/auth/admin-access";
import { findAdminByClerkUserId } from "@/lib/auth/admin-repository";
import { slugifyText } from "@/lib/content/slug";
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

export const createPublicTRPCContext = async () => {
  return {
    db,
    userId: null as string | null,
    sessionId: null as string | null,
    isAuthenticated: false,
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

  if (getAllowedAdminIds().length > 0 && !isAllowedAdmin(ctx.userId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only configured Beyond Blog admins can perform this action.",
    });
  }

  const adminUser = await findAdminByClerkUserId(ctx.userId);

  if (!adminUser || !adminUser.isActive || adminUser.role !== OWNER_ADMIN_ROLE) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only configured Beyond Blog admins can perform this action.",
    });
  }

  const displayName =
    `${adminUser.firstName ?? ""} ${adminUser.lastName ?? ""}`.trim() || adminUser.email;
  const slugBase = slugifyText(displayName) || `author-${adminUser.id.slice(-6).toLowerCase()}`;
  const persistedAdminProfile = await ctx.db.adminProfile.upsert({
    where: { clerkUserId: adminUser.clerkUserId },
    update: {
      adminUserId: adminUser.id,
    },
    create: {
      adminUserId: adminUser.id,
      clerkUserId: adminUser.clerkUserId,
      displayName,
      slug: `${slugBase}-${adminUser.id.slice(-6).toLowerCase()}`,
      email: adminUser.email,
    },
  });
  const adminProfile =
    persistedAdminProfile ?? {
      id: adminUser.id,
      clerkUserId: adminUser.clerkUserId,
      adminUserId: adminUser.id,
      displayName,
      slug: `${slugBase}-${adminUser.id.slice(-6).toLowerCase()}`,
      designation: null,
      bio: null,
      email: adminUser.email,
      address: null,
      phone: null,
      education: null,
      experience: null,
      profileImageId: null,
      socials: null,
      copyrightText: null,
      createdAt: adminUser.createdAt,
      updatedAt: adminUser.updatedAt,
    };

  return next({
    ctx: {
      ...ctx,
      adminUser,
      adminProfile,
    },
  });
});
