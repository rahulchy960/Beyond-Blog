import { TRPCError } from "@trpc/server";
import { MEDIA_TYPE, PUBLISH_STATUS } from "@/lib/content/enums";
import { createTRPCRouter, adminProcedure, publicProcedure } from "@/server/api/trpc";
import { buildHtmlFromRichText, normalizeRichTextDocument } from "@/lib/content/rich-text";
import {
  createContentInputSchema,
  createTagInputSchema,
  deleteContentInputSchema,
  getContentByIdInputSchema,
  getContentBySlugInputSchema,
  listAdminContentInputSchema,
  listPublicContentInputSchema,
  normalizeOptionalText,
  normalizeTagName,
  toggleFeaturedInputSchema,
  updateContentInputSchema,
  updateContentStatusInputSchema,
} from "@/lib/content/schemas";
import { slugifyText } from "@/lib/content/slug";
import { createAuditLog } from "@/server/audit/log";
import { revalidateContentPaths } from "@/lib/cache/revalidate";

const adminContentInclude = {
  category: true,
  coverImage: true,
  tags: {
    include: {
      tag: true,
    },
  },
} as const;

async function assertSlugUnique(
  slug: string,
  db: {
    content: {
      findFirst: (args: {
        where: { slug: string; id?: { not: string } };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
  },
  excludeId?: string,
) {
  const existing = await db.content.findFirst({
    where: {
      slug,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Another content entry already uses this slug.",
    });
  }
}

async function replaceContentTags(args: {
  contentId: string;
  tagNames: string[];
  db: {
    tag: {
      upsert: (params: {
        where: { slug: string };
        update: { name: string };
        create: { name: string; slug: string };
        select: { id: true };
      }) => Promise<{ id: string }>;
    };
    contentTag: {
      deleteMany: (params: { where: { contentId: string } }) => Promise<unknown>;
      createMany: (params: {
        data: Array<{ contentId: string; tagId: string }>;
        skipDuplicates: boolean;
      }) => Promise<unknown>;
    };
  };
}) {
  const uniqueTagNames = Array.from(
    new Set(
      args.tagNames
        .map((tagName) => normalizeTagName(tagName))
        .filter((tagName) => tagName.length > 0),
    ),
  );

  await args.db.contentTag.deleteMany({
    where: {
      contentId: args.contentId,
    },
  });

  if (uniqueTagNames.length === 0) {
    return;
  }

  const tagIds = await Promise.all(
    uniqueTagNames.map(async (tagName) => {
      const slug = slugifyText(tagName);
      if (!slug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid tag name: ${tagName}`,
        });
      }

      const tag = await args.db.tag.upsert({
        where: { slug },
        update: { name: tagName },
        create: {
          name: tagName,
          slug,
        },
        select: { id: true },
      });

      return tag.id;
    }),
  );

  await args.db.contentTag.createMany({
    data: tagIds.map((tagId) => ({
      contentId: args.contentId,
      tagId,
    })),
    skipDuplicates: true,
  });
}

async function assertValidCoverImageAsset(args: {
  mediaAssetId?: string | null;
  db: {
    mediaAsset: {
      findUnique: (params: {
        where: { id: string };
        select: { id: true; type: true };
      }) => Promise<{ id: string; type: string } | null>;
    };
  };
}) {
  const mediaAssetId = normalizeOptionalText(args.mediaAssetId);
  if (!mediaAssetId) {
    return null;
  }

  const media = await args.db.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    select: { id: true, type: true },
  });

  if (!media || media.type !== MEDIA_TYPE.IMAGE) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cover image must reference an existing IMAGE media asset.",
    });
  }

  return media.id;
}

function toAdminContentPayload(
  content: Awaited<
    ReturnType<
      typeof import("@/server/db").db.content.findUniqueOrThrow<{
        where: { id: string };
        include: typeof adminContentInclude;
      }>
    >
  >,
) {
  return {
    id: content.id,
    title: content.title,
    slug: content.slug,
    summary: content.summary,
    bodyJson: normalizeRichTextDocument(content.bodyJson),
    type: content.type,
    publishStatus: content.publishStatus,
    isFeatured: content.isFeatured,
    seoTitle: content.seoTitle,
    seoDescription: content.seoDescription,
    publishedAt: content.publishedAt,
    updatedAt: content.updatedAt,
    createdAt: content.createdAt,
    categoryId: content.categoryId,
    categoryName: content.category?.name ?? null,
    coverImageAssetId: content.coverImageAssetId,
    coverImageUrl: content.coverImage?.url ?? null,
    coverImage: content.coverImage
      ? {
          id: content.coverImage.id,
          url: content.coverImage.url,
          altText: content.coverImage.altText,
          type: content.coverImage.type,
        }
      : null,
    tagNames: content.tags.map((tagLink) => tagLink.tag.name),
  };
}

export const contentRouter = createTRPCRouter({
  create: adminProcedure.input(createContentInputSchema).mutation(async ({ ctx, input }) => {
    const slug = slugifyText(input.slug);

    if (!slug) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Slug is required.",
      });
    }

    await assertSlugUnique(slug, ctx.db);

    const bodyJson = normalizeRichTextDocument(input.bodyJson);
    const bodyHtml = buildHtmlFromRichText(bodyJson);
    const publishStatus = input.publishStatus;
    const shouldPublish = publishStatus === PUBLISH_STATUS.PUBLISHED;
    const coverImageAssetId = await assertValidCoverImageAsset({
      db: ctx.db,
      mediaAssetId: input.coverImageAssetId,
    });

    const created = await ctx.db.$transaction(async (transaction) => {
      const content = await transaction.content.create({
        data: {
          title: input.title.trim(),
          slug,
          summary: normalizeOptionalText(input.summary),
          bodyJson,
          bodyHtml,
          type: input.type,
          publishStatus,
          isFeatured: input.isFeatured,
          seoTitle: normalizeOptionalText(input.seoTitle),
          seoDescription: normalizeOptionalText(input.seoDescription),
          publishedAt: shouldPublish ? new Date() : null,
          authorId: ctx.adminUser.id,
          categoryId: normalizeOptionalText(input.categoryId),
          coverImageAssetId,
        },
      });

      await replaceContentTags({
        contentId: content.id,
        tagNames: input.tagNames,
        db: transaction,
      });
      return transaction.content.findUniqueOrThrow({
        where: { id: content.id },
        include: adminContentInclude,
      });
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "content.create",
      entityType: "CONTENT",
      entityId: created.id,
      metadata: {
        title: created.title,
        type: created.type,
        publishStatus: created.publishStatus,
      },
    });

    revalidateContentPaths({
      type: created.type,
      slug: created.slug,
      categorySlug: created.category?.slug ?? null,
      tagSlugs: created.tags.map((entry) => entry.tag.slug),
    });

    return toAdminContentPayload(created);
  }),

  update: adminProcedure.input(updateContentInputSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.content.findUnique({
      where: { id: input.id },
      include: adminContentInclude,
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Content not found.",
      });
    }

    const slug = slugifyText(input.slug);
    if (!slug) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Slug is required.",
      });
    }

    await assertSlugUnique(slug, ctx.db, input.id);

    const bodyJson = normalizeRichTextDocument(input.bodyJson);
    const bodyHtml = buildHtmlFromRichText(bodyJson);
    const publishStatus = input.publishStatus;
    const publishedAt =
      publishStatus === PUBLISH_STATUS.PUBLISHED ? existing.publishedAt ?? new Date() : null;
    const coverImageAssetId = await assertValidCoverImageAsset({
      db: ctx.db,
      mediaAssetId: input.coverImageAssetId,
    });

    const updated = await ctx.db.$transaction(async (transaction) => {
      const content = await transaction.content.update({
        where: { id: input.id },
        data: {
          title: input.title.trim(),
          slug,
          summary: normalizeOptionalText(input.summary),
          bodyJson,
          bodyHtml,
          type: input.type,
          publishStatus,
          isFeatured: input.isFeatured,
          seoTitle: normalizeOptionalText(input.seoTitle),
          seoDescription: normalizeOptionalText(input.seoDescription),
          publishedAt,
          categoryId: normalizeOptionalText(input.categoryId),
          coverImageAssetId,
        },
      });

      await replaceContentTags({
        contentId: content.id,
        tagNames: input.tagNames,
        db: transaction,
      });
      return transaction.content.findUniqueOrThrow({
        where: { id: content.id },
        include: adminContentInclude,
      });
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "content.update",
      entityType: "CONTENT",
      entityId: updated.id,
      metadata: {
        title: updated.title,
        type: updated.type,
        publishStatus: updated.publishStatus,
      },
    });

    revalidateContentPaths({
      type: updated.type,
      slug: updated.slug,
      previousSlug: existing.slug,
      categorySlug: updated.category?.slug ?? null,
      tagSlugs: updated.tags.map((entry) => entry.tag.slug),
    });

    return toAdminContentPayload(updated);
  }),

  delete: adminProcedure.input(deleteContentInputSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.content.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        title: true,
        type: true,
        slug: true,
        category: {
          select: {
            slug: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

    await ctx.db.content.delete({
      where: { id: input.id },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "content.delete",
      entityType: "CONTENT",
      entityId: input.id,
      metadata: {
        title: existing?.title ?? null,
        type: existing?.type ?? null,
      },
    });

    if (existing) {
      revalidateContentPaths({
        type: existing.type,
        slug: existing.slug,
        categorySlug: existing.category?.slug ?? null,
        tagSlugs: existing.tags.map((entry) => entry.tag.slug),
      });
    }

    return { id: input.id };
  }),

  getById: adminProcedure.input(getContentByIdInputSchema).query(async ({ ctx, input }) => {
    const content = await ctx.db.content.findUnique({
      where: { id: input.id },
      include: adminContentInclude,
    });

    if (!content) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Content not found.",
      });
    }

    return toAdminContentPayload(content);
  }),

  getBySlug: adminProcedure.input(getContentBySlugInputSchema).query(async ({ ctx, input }) => {
    const content = await ctx.db.content.findFirst({
      where: {
        slug: input.slug,
        type: input.type,
      },
      include: adminContentInclude,
    });

    if (!content) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Content not found.",
      });
    }

    return toAdminContentPayload(content);
  }),

  listForAdmin: adminProcedure.input(listAdminContentInputSchema).query(async ({ ctx, input }) => {
    const where = {
      ...(input.type ? { type: input.type } : {}),
      ...(input.status ? { publishStatus: input.status } : {}),
      ...(input.featured === "featured"
        ? { isFeatured: true }
        : input.featured === "not_featured"
          ? { isFeatured: false }
          : {}),
      ...(input.query
        ? {
            OR: [
              {
                title: {
                  contains: input.query,
                  mode: "insensitive" as const,
                },
              },
              {
                summary: {
                  contains: input.query,
                  mode: "insensitive" as const,
                },
              },
              {
                slug: {
                  contains: input.query,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      ctx.db.content.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
            take: 4,
          },
        },
      }),
      ctx.db.content.count({ where }),
    ]);

    return {
      items,
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }),

  publish: adminProcedure.input(updateContentStatusInputSchema).mutation(async ({ ctx, input }) => {
    const updated = await ctx.db.content.update({
      where: { id: input.id },
      data: {
        publishStatus: PUBLISH_STATUS.PUBLISHED,
        publishedAt: new Date(),
      },
      select: {
        id: true,
        publishStatus: true,
        slug: true,
        type: true,
        category: {
          select: {
            slug: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "content.publish",
      entityType: "CONTENT",
      entityId: updated.id,
      metadata: {
        publishStatus: updated.publishStatus,
      },
    });

    revalidateContentPaths({
      type: updated.type,
      slug: updated.slug,
      categorySlug: updated.category?.slug ?? null,
      tagSlugs: updated.tags.map((entry) => entry.tag.slug),
    });

    return updated;
  }),

  unpublish: adminProcedure
    .input(updateContentStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.content.update({
        where: { id: input.id },
        data: {
          publishStatus: PUBLISH_STATUS.DRAFT,
          publishedAt: null,
        },
        select: {
          id: true,
          publishStatus: true,
          slug: true,
          type: true,
          category: {
            select: {
              slug: true,
            },
          },
          tags: {
            select: {
              tag: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "content.move_to_draft",
        entityType: "CONTENT",
        entityId: updated.id,
        metadata: {
          publishStatus: updated.publishStatus,
        },
      });

      revalidateContentPaths({
        type: updated.type,
        slug: updated.slug,
        categorySlug: updated.category?.slug ?? null,
        tagSlugs: updated.tags.map((entry) => entry.tag.slug),
      });

      return updated;
    }),

  archive: adminProcedure.input(updateContentStatusInputSchema).mutation(async ({ ctx, input }) => {
    const updated = await ctx.db.content.update({
      where: { id: input.id },
      data: {
        publishStatus: PUBLISH_STATUS.ARCHIVED,
      },
      select: {
        id: true,
        publishStatus: true,
        slug: true,
        type: true,
        category: {
          select: {
            slug: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "content.archive",
      entityType: "CONTENT",
      entityId: updated.id,
      metadata: {
        publishStatus: updated.publishStatus,
      },
    });

    revalidateContentPaths({
      type: updated.type,
      slug: updated.slug,
      categorySlug: updated.category?.slug ?? null,
      tagSlugs: updated.tags.map((entry) => entry.tag.slug),
    });

    return updated;
  }),

  toggleFeatured: adminProcedure.input(toggleFeaturedInputSchema).mutation(async ({ ctx, input }) => {
    const current = await ctx.db.content.findUnique({
      where: { id: input.id },
      select: { isFeatured: true },
    });

    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Content not found.",
      });
    }

    const updated = await ctx.db.content.update({
      where: { id: input.id },
      data: {
        isFeatured: input.value ?? !current.isFeatured,
      },
      select: {
        id: true,
        isFeatured: true,
        slug: true,
        type: true,
        category: {
          select: {
            slug: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "content.toggle_featured",
      entityType: "CONTENT",
      entityId: updated.id,
      metadata: {
        isFeatured: updated.isFeatured,
      },
    });

    revalidateContentPaths({
      type: updated.type,
      slug: updated.slug,
      categorySlug: updated.category?.slug ?? null,
      tagSlugs: updated.tags.map((entry) => entry.tag.slug),
    });

    return updated;
  }),

  listCategories: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }),

  listTags: adminProcedure
    .input(
      listPublicContentInputSchema
        .pick({
          query: true,
          limit: true,
        })
        .partial()
        .transform((data) => ({
          query: data.query,
          limit: data.limit ?? 40,
        })),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.tag.findMany({
        where: input.query
          ? {
              name: {
                contains: input.query,
                mode: "insensitive",
              },
            }
          : undefined,
        orderBy: [{ name: "asc" }],
        take: input.limit,
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
    }),

  createTag: adminProcedure.input(createTagInputSchema).mutation(async ({ ctx, input }) => {
    const name = normalizeTagName(input.name);
    const slug = slugifyText(name);

    if (!slug) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tag name is invalid.",
      });
    }

    const tag = await ctx.db.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "taxonomy.tag.upsert",
      entityType: "TAG",
      entityId: tag.id,
      metadata: {
        name: tag.name,
        slug: tag.slug,
      },
    });

    return tag;
  }),

  listPublished: publicProcedure.input(listPublicContentInputSchema).query(async ({ ctx, input }) => {
    return ctx.db.content.findMany({
      where: {
        type: input.type,
        publishStatus: PUBLISH_STATUS.PUBLISHED,
        ...(input.query
          ? {
              OR: [
                {
                  title: {
                    contains: input.query,
                    mode: "insensitive",
                  },
                },
                {
                  summary: {
                    contains: input.query,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: input.limit,
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
    });
  }),

  getPublishedBySlug: publicProcedure
    .input(getContentBySlugInputSchema)
    .query(async ({ ctx, input }) => {
      const content = await ctx.db.content.findFirst({
        where: {
          slug: input.slug,
          type: input.type,
          publishStatus: PUBLISH_STATUS.PUBLISHED,
        },
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
      });

      if (!content) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Published content not found.",
        });
      }

      return {
        ...content,
        bodyJson: normalizeRichTextDocument(content.bodyJson),
      };
    }),
});
