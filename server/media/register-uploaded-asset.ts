import "server-only";

import type { MediaAsset, MediaType, PrismaClient } from "@prisma/client";
import { MEDIA_TYPE } from "@/lib/content/enums";
import { normalizeOptionalText } from "@/lib/media/schemas";

type RegisterUploadedAssetInput = {
  type: MediaType;
  title?: string | null;
  storageProvider: string;
  storageKey: string;
  url: string;
  thumbnailUrl?: string | null;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  originalFilename?: string | null;
  uploadedByAdminId?: string | null;
};

const mediaAssetSelect = {
  id: true,
  type: true,
  title: true,
  storageProvider: true,
  storageKey: true,
  providerAssetId: true,
  externalUrl: true,
  playbackUrl: true,
  url: true,
  thumbnailUrl: true,
  altText: true,
  caption: true,
  mimeType: true,
  sizeBytes: true,
  width: true,
  height: true,
  durationSeconds: true,
  originalFilename: true,
  contentId: true,
  uploadedByAdminId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Record<keyof MediaAsset, true>;

export async function registerUploadedMediaAsset(args: {
  db: PrismaClient;
  input: RegisterUploadedAssetInput;
}) {
  const title =
    normalizeOptionalText(args.input.title) ??
    normalizeOptionalText(args.input.originalFilename);
  const originalFilename = normalizeOptionalText(args.input.originalFilename);
  const thumbnailUrl =
    args.input.type === MEDIA_TYPE.IMAGE
      ? normalizeOptionalText(args.input.thumbnailUrl) ?? args.input.url
      : normalizeOptionalText(args.input.thumbnailUrl);

  const mediaData = {
    type: args.input.type,
    title,
    storageProvider: args.input.storageProvider,
    storageKey: args.input.storageKey,
    providerAssetId: args.input.storageKey,
    url: args.input.url,
    thumbnailUrl,
    mimeType: args.input.mimeType,
    sizeBytes: args.input.sizeBytes,
    width: args.input.width ?? null,
    height: args.input.height ?? null,
    originalFilename,
  };

  const existing = await args.db.mediaAsset.findFirst({
    where: {
      OR: [
        {
          storageProvider: args.input.storageProvider,
          storageKey: args.input.storageKey,
        },
        {
          url: args.input.url,
        },
      ],
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return args.db.mediaAsset.update({
      where: {
        id: existing.id,
      },
      data: {
        ...mediaData,
        uploadedByAdminId: args.input.uploadedByAdminId ?? undefined,
      },
      select: mediaAssetSelect,
    });
  }

  return args.db.mediaAsset.create({
    data: {
      ...mediaData,
      uploadedByAdminId: args.input.uploadedByAdminId ?? null,
    },
    select: mediaAssetSelect,
  });
}
