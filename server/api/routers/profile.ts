import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { COURSE_STATUS, MEDIA_TYPE, PUBLISH_STATUS } from "@/lib/content/enums";
import { adminProfileSettingsInputSchema, normalizeOptionalText } from "@/lib/profile/schemas";
import { defaultSeoSettings, mergeSeoSettings } from "@/lib/seo/config";
import { adminSeoSettingsInputSchema } from "@/lib/seo/schemas";
import { revalidateProfileAndSeoPaths } from "@/lib/cache/revalidate";
import { createTRPCRouter, adminProcedure, publicProcedure } from "@/server/api/trpc";
import { createAuditLog } from "@/server/audit/log";

const authorSlugInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

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

function isMissingSiteSettingTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      return true;
    }

    if (error.code === "P2010" && String(error.message).includes("SiteSetting")) {
      return true;
    }
  }

  return false;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function socialValue(socials: unknown, key: string) {
  const record = toRecord(socials);
  const value = record?.[key];
  return typeof value === "string" ? value : null;
}

function profileSocials(input: {
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
}) {
  return {
    linkedinUrl: normalizeOptionalText(input.linkedinUrl),
    githubUrl: normalizeOptionalText(input.githubUrl),
    twitterUrl: normalizeOptionalText(input.twitterUrl),
    websiteUrl: normalizeOptionalText(input.websiteUrl),
  };
}

function mergeSocialLinksWithSeo(
  existingSocialLinks: unknown,
  input: {
    titleTemplate: string | null;
    defaultDescription: string | null;
    siteUrl: string | null;
    defaultOgImageUrl: string | null;
    noIndexSearchPage: boolean;
    allowIndexing: boolean;
    twitterHandle: string | null;
  },
) {
  const base = toRecord(existingSocialLinks) ?? {};
  const existingSeo = toRecord(base.seo) ?? {};

  const nextSeo = {
    ...existingSeo,
    titleTemplate: normalizeOptionalText(input.titleTemplate),
    defaultDescription: normalizeOptionalText(input.defaultDescription),
    siteUrl: normalizeOptionalText(input.siteUrl),
    defaultOgImageUrl: normalizeOptionalText(input.defaultOgImageUrl),
    noIndexSearchPage: input.noIndexSearchPage,
    allowIndexing: input.allowIndexing,
    twitterHandle: normalizeOptionalText(input.twitterHandle),
  };

  return {
    ...base,
    seo: nextSeo,
  };
}

export const profileRouter = createTRPCRouter({
  getSettings: adminProcedure.query(async ({ ctx }) => {
    try {
      const profile = await ctx.db.adminProfile.findUniqueOrThrow({
        where: { id: ctx.adminProfile.id },
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

      return {
        ...profile,
        linkedinUrl: socialValue(profile.socials, "linkedinUrl"),
        githubUrl: socialValue(profile.socials, "githubUrl"),
        twitterUrl: socialValue(profile.socials, "twitterUrl"),
        websiteUrl: socialValue(profile.socials, "websiteUrl"),
      };
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
        const existingSlug = await ctx.db.adminProfile.findFirst({
          where: {
            slug: input.slug,
            id: {
              not: ctx.adminProfile.id,
            },
          },
          select: { id: true },
        });

        if (existingSlug) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Another admin profile already uses this slug.",
          });
        }

        const updated = await ctx.db.adminProfile.update({
          where: { id: ctx.adminProfile.id },
          data: {
            displayName: input.displayName.trim(),
            slug: input.slug.trim(),
            designation: normalizeOptionalText(input.designation),
            bio: normalizeOptionalText(input.bio),
            address: normalizeOptionalText(input.address),
            email: normalizeOptionalText(input.email),
            phone: normalizeOptionalText(input.phone),
            experience: normalizeOptionalText(input.experience),
            education: normalizeOptionalText(input.education),
            profileImageId,
            socials: profileSocials(input),
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

        await ctx.db.siteSetting.upsert({
          where: { singletonKey: "SITE_SETTINGS" },
          update: {
            featuredFooterProfileId: updated.id,
          },
          create: {
            singletonKey: "SITE_SETTINGS",
            siteTitle: defaultSeoSettings.siteTitle,
            featuredFooterProfileId: updated.id,
          },
        });

        await createAuditLog({
          db: ctx.db,
          adminUserId: ctx.adminUser.id,
          action: "settings.profile.update",
          entityType: "ADMIN_PROFILE",
          entityId: updated.id,
          metadata: {
            displayName: updated.displayName,
            slug: updated.slug,
            designation: updated.designation,
            hasProfileImage: Boolean(updated.profileImageId),
          },
        });

        revalidateProfileAndSeoPaths();

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
          id:
            (
              await ctx.db.siteSetting.findUnique({
                where: { singletonKey: "SITE_SETTINGS" },
                select: { featuredFooterProfileId: true },
              })
            )?.featuredFooterProfileId ?? "",
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
        const fallback = await ctx.db.adminProfile.findFirst({
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
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

        if (!fallback) {
          return null;
        }

        return {
          displayName: fallback.displayName,
          slug: fallback.slug,
          designation: fallback.designation,
          bio: fallback.bio,
          address: fallback.address,
          email: fallback.email,
          phone: fallback.phone,
          experience: fallback.experience,
          education: fallback.education,
          profileImage: fallback.profileImage,
          linkedinUrl: socialValue(fallback.socials, "linkedinUrl"),
          githubUrl: socialValue(fallback.socials, "githubUrl"),
          twitterUrl: socialValue(fallback.socials, "twitterUrl"),
          websiteUrl: socialValue(fallback.socials, "websiteUrl"),
          copyrightText: fallback.copyrightText,
        };
      }

      return {
        displayName: profile.displayName,
        slug: profile.slug,
        designation: profile.designation,
        bio: profile.bio,
        address: profile.address,
        email: profile.email,
        phone: profile.phone,
        experience: profile.experience,
        education: profile.education,
        profileImage: profile.profileImage,
        linkedinUrl: socialValue(profile.socials, "linkedinUrl"),
        githubUrl: socialValue(profile.socials, "githubUrl"),
        twitterUrl: socialValue(profile.socials, "twitterUrl"),
        websiteUrl: socialValue(profile.socials, "websiteUrl"),
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
    const profile = await ctx.db.adminProfile.findFirst({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        displayName: true,
        slug: true,
        email: true,
        profileImage: {
          select: {
            url: true,
          },
        },
        adminUser: {
          select: {
            imageUrl: true,
          },
        },
      },
    });

    if (!profile) {
      return {
        name: "Beyond Blog Admin",
        slug: null as string | null,
        imageUrl: null as string | null,
      };
    }

    return {
      name: profile.displayName,
      slug: profile.slug,
      imageUrl: profile.profileImage?.url ?? profile.adminUser.imageUrl,
    };
  }),

  listAuthors: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.adminProfile.findMany({
      orderBy: [{ createdAt: "asc" }, { displayName: "asc" }],
      select: {
        id: true,
        displayName: true,
        slug: true,
        designation: true,
        bio: true,
        socials: true,
        profileImage: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            altText: true,
          },
        },
        _count: {
          select: {
            contents: {
              where: { publishStatus: PUBLISH_STATUS.PUBLISHED },
            },
            courses: {
              where: { status: COURSE_STATUS.PUBLISHED },
            },
          },
        },
      },
    });
  }),

  getAuthorBySlug: publicProcedure.input(authorSlugInputSchema).query(async ({ ctx, input }) => {
    const author = await ctx.db.adminProfile.findUnique({
      where: { slug: input.slug },
      include: {
        profileImage: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            altText: true,
          },
        },
        contents: {
          where: { publishStatus: PUBLISH_STATUS.PUBLISHED },
          orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
            coverImage: {
              select: {
                url: true,
                altText: true,
              },
            },
            author: {
              select: {
                displayName: true,
                slug: true,
              },
            },
            tags: {
              include: {
                tag: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        courses: {
          where: { status: COURSE_STATUS.PUBLISHED },
          orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
          include: {
            coverImage: {
              select: {
                id: true,
                url: true,
                thumbnailUrl: true,
                altText: true,
              },
            },
            author: {
              select: {
                displayName: true,
                slug: true,
              },
            },
            _count: {
              select: {
                sections: true,
                lessons: true,
              },
            },
          },
        },
      },
    });

    if (!author) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Author profile not found.",
      });
    }

    return {
      ...author,
      linkedinUrl: socialValue(author.socials, "linkedinUrl"),
      githubUrl: socialValue(author.socials, "githubUrl"),
      twitterUrl: socialValue(author.socials, "twitterUrl"),
      websiteUrl: socialValue(author.socials, "websiteUrl"),
    };
  }),

  getSeoSettings: adminProcedure.query(async ({ ctx }) => {
    try {
      const setting = await ctx.db.siteSetting.upsert({
        where: { singletonKey: "SITE_SETTINGS" },
        update: {},
        create: {
          singletonKey: "SITE_SETTINGS",
          siteTitle: defaultSeoSettings.siteTitle,
        },
        select: {
          id: true,
          siteTitle: true,
          siteSubtitle: true,
          socialLinks: true,
          updatedAt: true,
        },
      });

      const resolved = mergeSeoSettings({
        siteTitle: setting.siteTitle,
        siteSubtitle: setting.siteSubtitle,
        socialLinks: setting.socialLinks,
      });

      return {
        id: setting.id,
        siteTitle: resolved.siteTitle,
        titleTemplate: resolved.titleTemplate,
        defaultDescription: resolved.defaultDescription,
        siteUrl: resolved.siteUrl,
        defaultOgImageUrl: resolved.defaultOgImageUrl,
        noIndexSearchPage: resolved.noIndexSearchPage,
        allowIndexing: resolved.allowIndexing,
        twitterHandle: resolved.twitterHandle,
        updatedAt: setting.updatedAt,
      };
    } catch (error) {
      if (isMissingSiteSettingTableError(error)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Site settings table is missing. Run Prisma migration before using SEO settings.",
        });
      }

      throw error;
    }
  }),

  updateSeoSettings: adminProcedure
    .input(adminSeoSettingsInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const current = await ctx.db.siteSetting.findUnique({
          where: { singletonKey: "SITE_SETTINGS" },
          select: {
            socialLinks: true,
          },
        });

        const socialLinks = mergeSocialLinksWithSeo(current?.socialLinks, {
          titleTemplate: input.titleTemplate ?? null,
          defaultDescription: input.defaultDescription ?? null,
          siteUrl: input.siteUrl ?? null,
          defaultOgImageUrl: input.defaultOgImageUrl ?? null,
          noIndexSearchPage: input.noIndexSearchPage,
          allowIndexing: input.allowIndexing,
          twitterHandle: input.twitterHandle ?? null,
        });

        const updated = await ctx.db.siteSetting.upsert({
          where: { singletonKey: "SITE_SETTINGS" },
          update: {
            siteTitle: input.siteTitle.trim(),
            socialLinks,
          },
          create: {
            singletonKey: "SITE_SETTINGS",
            siteTitle: input.siteTitle.trim(),
            socialLinks,
          },
          select: {
            id: true,
            siteTitle: true,
            siteSubtitle: true,
            socialLinks: true,
            updatedAt: true,
          },
        });

        await createAuditLog({
          db: ctx.db,
          adminUserId: ctx.adminUser.id,
          action: "settings.seo.update",
          entityType: "SITE_SETTING",
          entityId: updated.id,
          metadata: {
            siteTitle: updated.siteTitle,
            allowIndexing: input.allowIndexing,
            noIndexSearchPage: input.noIndexSearchPage,
          },
        });

        revalidateProfileAndSeoPaths();

        const resolved = mergeSeoSettings({
          siteTitle: updated.siteTitle,
          siteSubtitle: updated.siteSubtitle,
          socialLinks: updated.socialLinks,
        });

        return {
          id: updated.id,
          siteTitle: resolved.siteTitle,
          titleTemplate: resolved.titleTemplate,
          defaultDescription: resolved.defaultDescription,
          siteUrl: resolved.siteUrl,
          defaultOgImageUrl: resolved.defaultOgImageUrl,
          noIndexSearchPage: resolved.noIndexSearchPage,
          allowIndexing: resolved.allowIndexing,
          twitterHandle: resolved.twitterHandle,
          updatedAt: updated.updatedAt,
        };
      } catch (error) {
        if (isMissingSiteSettingTableError(error)) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Site settings table is missing. Run Prisma migration before updating SEO settings.",
          });
        }

        throw error;
      }
    }),

  getPublicSeoSettings: publicProcedure.query(async ({ ctx }) => {
    try {
      const setting = await ctx.db.siteSetting.findUnique({
        where: { singletonKey: "SITE_SETTINGS" },
        select: {
          siteTitle: true,
          siteSubtitle: true,
          socialLinks: true,
        },
      });

      if (!setting) {
        return {
          siteTitle: defaultSeoSettings.siteTitle,
          siteSubtitle: null as string | null,
          socialLinks: null as Prisma.JsonValue | null,
        };
      }

      return setting;
    } catch (error) {
      if (isMissingSiteSettingTableError(error)) {
        return {
          siteTitle: defaultSeoSettings.siteTitle,
          siteSubtitle: null as string | null,
          socialLinks: null as Prisma.JsonValue | null,
        };
      }

      throw error;
    }
  }),
});
