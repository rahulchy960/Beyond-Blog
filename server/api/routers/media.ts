import { TRPCError } from "@trpc/server";
import { MEDIA_TYPE } from "@/lib/content/enums";
import {
  attachMediaToContentInputSchema,
  createExternalVideoInputSchema,
  deleteMediaInputSchema,
  detachMediaFromContentInputSchema,
  listMediaForPickerInputSchema,
  listMediaInputSchema,
  normalizeOptionalText,
  registerUploadInputSchema,
  registerUploadedAssetInputSchema,
  updateMediaMetadataInputSchema,
} from "@/lib/media/schemas";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { deleteProviderAsset } from "@/server/media/provider";
import { registerUploadedMediaAsset } from "@/server/media/register-uploaded-asset";
import { createAuditLog } from "@/server/audit/log";
import { revalidatePublicIndexes } from "@/lib/cache/revalidate";

export const mediaRouter = createTRPCRouter({
  list: adminProcedure.input(listMediaInputSchema).query(async ({ ctx, input }) => {
    const take = input.limit + 1;

    const items = await ctx.db.mediaAsset.findMany({
      where: {
        ...(input.type ? { type: input.type } : {}),
        ...(input.query
          ? {
              OR: [
                { title: { contains: input.query, mode: "insensitive" } },
                { originalFilename: { contains: input.query, mode: "insensitive" } },
                { altText: { contains: input.query, mode: "insensitive" } },
                { caption: { contains: input.query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy:
        input.sort === "oldest"
          ? [{ createdAt: "asc" }, { id: "asc" }]
          : [{ createdAt: "desc" }, { id: "desc" }],
      ...(input.cursor
        ? {
            cursor: { id: input.cursor },
            skip: 1,
          }
        : {}),
      take,
      include: {
        content: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
          },
        },
      },
    });

    const hasNextPage = items.length > input.limit;
    const slicedItems = hasNextPage ? items.slice(0, -1) : items;

    return {
      items: slicedItems,
      nextCursor: hasNextPage ? slicedItems[slicedItems.length - 1]?.id : null,
    };
  }),

  listForPicker: adminProcedure
    .input(listMediaForPickerInputSchema)
    .query(async ({ ctx, input }) => {
      return ctx.db.mediaAsset.findMany({
        where: {
          type: input.types ? { in: input.types } : MEDIA_TYPE.IMAGE,
          ...(input.query
            ? {
                OR: [
                  { title: { contains: input.query, mode: "insensitive" } },
                  { originalFilename: { contains: input.query, mode: "insensitive" } },
                  { altText: { contains: input.query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: "desc" }],
        take: input.limit,
      });
    }),

  getById: adminProcedure
    .input(deleteMediaInputSchema)
    .query(async ({ ctx, input }) => {
      const media = await ctx.db.mediaAsset.findUnique({
        where: { id: input.id },
      });

      if (!media) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Media asset not found.",
        });
      }

      return media;
    }),

  updateMetadata: adminProcedure
    .input(updateMediaMetadataInputSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.mediaAsset.update({
        where: { id: input.id },
        data: {
          title: normalizeOptionalText(input.title),
          altText: normalizeOptionalText(input.altText),
          caption: normalizeOptionalText(input.caption),
          thumbnailUrl: normalizeOptionalText(input.thumbnailUrl),
          externalUrl: normalizeOptionalText(input.externalUrl),
          playbackUrl: normalizeOptionalText(input.playbackUrl),
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "media.update_metadata",
        entityType: "MEDIA_ASSET",
        entityId: updated.id,
        metadata: {
          title: updated.title,
          type: updated.type,
          mimeType: updated.mimeType,
        },
      });

      revalidatePublicIndexes();

      return updated;
    }),

  delete: adminProcedure.input(deleteMediaInputSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.mediaAsset.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        storageProvider: true,
        storageKey: true,
      },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Media asset not found.",
      });
    }

    await ctx.db.mediaAsset.delete({
      where: { id: input.id },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "media.delete",
      entityType: "MEDIA_ASSET",
      entityId: input.id,
      metadata: {
        storageProvider: existing.storageProvider,
        storageKey: existing.storageKey,
      },
    });

    revalidatePublicIndexes();

    await deleteProviderAsset({
      storageProvider: existing.storageProvider,
      storageKey: existing.storageKey,
    });

    return { id: input.id };
  }),

  attachToContent: adminProcedure
    .input(attachMediaToContentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const content = await ctx.db.content.findUnique({
        where: { id: input.contentId },
        select: { id: true },
      });

      if (!content) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found.",
        });
      }

      const updated = await ctx.db.mediaAsset.update({
        where: { id: input.mediaId },
        data: { contentId: input.contentId },
        select: { id: true, contentId: true },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "media.attach_to_content",
        entityType: "MEDIA_ASSET",
        entityId: updated.id,
        metadata: {
          contentId: updated.contentId,
        },
      });

      revalidatePublicIndexes();

      return updated;
    }),

  detachFromContent: adminProcedure
    .input(detachMediaFromContentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.mediaAsset.update({
        where: { id: input.mediaId },
        data: { contentId: null },
        select: { id: true, contentId: true },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "media.detach_from_content",
        entityType: "MEDIA_ASSET",
        entityId: updated.id,
      });

      revalidatePublicIndexes();

      return updated;
    }),

  createExternalVideo: adminProcedure
    .input(createExternalVideoInputSchema)
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.db.mediaAsset.create({
        data: {
          type: MEDIA_TYPE.VIDEO,
          title: normalizeOptionalText(input.title),
          storageProvider: input.provider,
          providerAssetId: normalizeOptionalText(input.providerAssetId),
          externalUrl: input.externalUrl,
          playbackUrl: normalizeOptionalText(input.playbackUrl),
          url: input.playbackUrl ?? input.externalUrl,
          thumbnailUrl: normalizeOptionalText(input.thumbnailUrl),
          mimeType: input.mimeType,
          sizeBytes: 0,
          durationSeconds: input.durationSeconds ?? null,
          uploadedByAdminId: ctx.adminUser.id,
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "media.create_external_video",
        entityType: "MEDIA_ASSET",
        entityId: created.id,
        metadata: {
          provider: created.storageProvider,
          url: created.url,
        },
      });

      revalidatePublicIndexes();

      return created;
    }),

  registerUploadedAsset: adminProcedure
    .input(registerUploadedAssetInputSchema)
    .mutation(async ({ ctx, input }) => {
      const media = await registerUploadedMediaAsset({
        db: ctx.db,
        input: {
          ...input,
          uploadedByAdminId: ctx.adminUser.id,
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "media.register_uploadthing_asset",
        entityType: "MEDIA_ASSET",
        entityId: media.id,
        metadata: {
          storageProvider: media.storageProvider,
          storageKey: media.storageKey,
          mimeType: media.mimeType,
        },
      });

      revalidatePublicIndexes();

      return media;
    }),

  registerUpload: adminProcedure
    .input(registerUploadInputSchema)
    .mutation(async ({ ctx, input }) => {
      const media = await registerUploadedMediaAsset({
        db: ctx.db,
        input: {
          type: input.mimeType?.startsWith("image/") ? MEDIA_TYPE.IMAGE : MEDIA_TYPE.FILE,
          title: input.name,
          storageProvider: "uploadthing",
          storageKey: input.key ?? input.url,
          url: input.url,
          thumbnailUrl: input.mimeType?.startsWith("image/") ? input.url : null,
          mimeType: input.mimeType ?? "application/octet-stream",
          sizeBytes: input.size ?? 0,
          originalFilename: input.name,
          uploadedByAdminId: ctx.adminUser.id,
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "media.register_upload",
        entityType: "MEDIA_ASSET",
        entityId: media.id,
        metadata: {
          storageProvider: media.storageProvider,
          storageKey: media.storageKey,
          mimeType: media.mimeType,
        },
      });

      revalidatePublicIndexes();

      return media;
    }),
});

