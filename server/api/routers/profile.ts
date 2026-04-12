import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { MEDIA_TYPE } from "@/lib/content/enums";
import { adminProfileSettingsInputSchema, normalizeOptionalText } from "@/lib/profile/schemas";
import { createTRPCRouter, adminProcedure, publicProcedure } from "@/server/api/trpc";
import { createAuditLog } from "@/server/audit/log";

async function resolveProfileImageId(args: {
  db: {
    mediaAsset: {
      findUnique: (params: {
        where: { id: string };
        select: { id: true; type: true };
      }) => Promise<{ id: string; type: string } | null>;
    };
  };
  profileImageId?: string | null;
}) {
  const profileImageId = normalizeOptionalText(args.profileImageId);
  if (!profileImageId) {
    return null;
  }

  const media = await args.db.mediaAsset.findUnique({
    where: { id: profileImageId },
    select: { id: true, type: true },
  });

  if (!media || media.type !== MEDIA_TYPE.IMAGE) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Profile image must reference an IMAGE media asset.",
    });
  }

  return media.id;
}

function isMissingAdminProfileTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      return true;
    }

    if (error.code === "P2010" && String(error.message).includes("AdminProfile")) {
      return true;
    }
  }

  return false;
}

export const profileRouter = createTRPCRouter({
  getSettings: adminProcedure.query(async ({ ctx }) => {
    try {
      const profile = await ctx.db.adminProfile.upsert({
        where: { singletonKey: "ADMIN_PROFILE" },
        update:
          ctx.adminUser.id
            ? {
                adminUserId: ctx.adminUser.id,
              }
            : {},
        create: {
          singletonKey: "ADMIN_PROFILE",
          adminUserId: ctx.adminUser.id,
        },
        include: {
          profileImage: {
            select: {
              id: true,
              url: true,
              thumbnailUrl: true,
              altText: true,
            },
          },
        },
      });

      return profile;
    } catch (error) {
      if (isMissingAdminProfileTableError(error)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Admin profile table is missing. Run Prisma migration before using profile settings.",
        });
      }

      throw error;
    }
  }),

  updateSettings: adminProcedure
    .input(adminProfileSettingsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const profileImageId = await resolveProfileImageId({
        db: ctx.db,
        profileImageId: input.profileImageId,
      });

      try {
        const updated = await ctx.db.adminProfile.upsert({
          where: { singletonKey: "ADMIN_PROFILE" },
          update: {
            adminUserId: ctx.adminUser.id,
            fullName: normalizeOptionalText(input.fullName),
            designation: normalizeOptionalText(input.designation),
            bio: normalizeOptionalText(input.bio),
            address: normalizeOptionalText(input.address),
            email: normalizeOptionalText(input.email),
            phone: normalizeOptionalText(input.phone),
            jobs: normalizeOptionalText(input.jobs),
            education: normalizeOptionalText(input.education),
            profileImageId,
            linkedinUrl: normalizeOptionalText(input.linkedinUrl),
            githubUrl: normalizeOptionalText(input.githubUrl),
            twitterUrl: normalizeOptionalText(input.twitterUrl),
            websiteUrl: normalizeOptionalText(input.websiteUrl),
            copyrightText: normalizeOptionalText(input.copyrightText),
          },
          create: {
            singletonKey: "ADMIN_PROFILE",
            adminUserId: ctx.adminUser.id,
            fullName: normalizeOptionalText(input.fullName),
            designation: normalizeOptionalText(input.designation),
            bio: normalizeOptionalText(input.bio),
            address: normalizeOptionalText(input.address),
            email: normalizeOptionalText(input.email),
            phone: normalizeOptionalText(input.phone),
            jobs: normalizeOptionalText(input.jobs),
            education: normalizeOptionalText(input.education),
            profileImageId,
            linkedinUrl: normalizeOptionalText(input.linkedinUrl),
            githubUrl: normalizeOptionalText(input.githubUrl),
            twitterUrl: normalizeOptionalText(input.twitterUrl),
            websiteUrl: normalizeOptionalText(input.websiteUrl),
            copyrightText: normalizeOptionalText(input.copyrightText),
          },
          include: {
            profileImage: {
              select: {
                id: true,
                url: true,
                thumbnailUrl: true,
                altText: true,
              },
            },
          },
        });

        await createAuditLog({
          db: ctx.db,
          adminUserId: ctx.adminUser.id,
          action: "settings.profile.update",
          entityType: "ADMIN_PROFILE",
          entityId: updated.id,
          metadata: {
            fullName: updated.fullName,
            designation: updated.designation,
            hasProfileImage: Boolean(updated.profileImageId),
          },
        });

        return updated;
      } catch (error) {
        if (isMissingAdminProfileTableError(error)) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Admin profile table is missing. Run Prisma migration before updating profile settings.",
          });
        }

        throw error;
      }
    }),

  getPublicFooterProfile: publicProcedure.query(async ({ ctx }) => {
    try {
      const profile = await ctx.db.adminProfile.findUnique({
        where: {
          singletonKey: "ADMIN_PROFILE",
        },
        include: {
          profileImage: {
            select: {
              id: true,
              url: true,
              thumbnailUrl: true,
              altText: true,
            },
          },
        },
      });

      if (!profile) {
        return null;
      }

      return {
        fullName: profile.fullName,
        designation: profile.designation,
        bio: profile.bio,
        address: profile.address,
        email: profile.email,
        phone: profile.phone,
        jobs: profile.jobs,
        education: profile.education,
        profileImage: profile.profileImage,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        twitterUrl: profile.twitterUrl,
        websiteUrl: profile.websiteUrl,
        copyrightText: profile.copyrightText,
      };
    } catch (error) {
      if (isMissingAdminProfileTableError(error)) {
        // Fallback for environments where migration hasn't been applied yet.
        // Public footer should remain functional without profile data.
        return null;
      }

      throw error;
    }
  }),

  getPublicIdentity: publicProcedure.query(async ({ ctx }) => {
    const admin = await ctx.db.adminUser.findFirst({
      where: {
        role: "OWNER",
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        imageUrl: true,
      },
    });

    if (!admin) {
      return {
        name: "Beyond Blog Admin",
        imageUrl: null as string | null,
      };
    }

    const fallbackName = `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim() || admin.email;
    let profileName: string | null = null;
    let profileImageUrl: string | null = null;

    try {
      const profile = await ctx.db.adminProfile.findUnique({
        where: {
          singletonKey: "ADMIN_PROFILE",
        },
        include: {
          profileImage: {
            select: {
              url: true,
            },
          },
        },
      });

      profileName = profile?.fullName ?? null;
      profileImageUrl = profile?.profileImage?.url ?? null;
    } catch (error) {
      if (!isMissingAdminProfileTableError(error)) {
        throw error;
      }
    }

    return {
      name: profileName ?? fallbackName,
      imageUrl: profileImageUrl ?? admin.imageUrl,
    };
  }),
});

