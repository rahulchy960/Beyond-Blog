import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { MEDIA_TYPE } from "@/lib/content/enums";
import { findAdminByClerkUserId } from "@/lib/auth/admin-repository";
import { db } from "@/server/db";

const f = createUploadthing();

const ALLOWED_FILE_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function resolveFileUrl(file: {
  ufsUrl?: string | null;
  url?: string | null;
  appUrl?: string | null;
}) {
  return file.ufsUrl ?? file.url ?? file.appUrl ?? null;
}

async function requireUploadAdmin() {
  const { userId } = await auth();
  if (!userId) {
    throw new UploadThingError("Sign-in required.");
  }

  const adminUser = await findAdminByClerkUserId(userId);
  if (!adminUser || !adminUser.isActive || adminUser.role !== "OWNER") {
    throw new UploadThingError("Only the configured Beyond Blog admin can upload files.");
  }

  return adminUser;
}

export const beyondBlogFileRouter = {
  mediaImage: f({
    image: {
      maxFileCount: 6,
      maxFileSize: "8MB",
    },
  })
    .middleware(async () => {
      const adminUser = await requireUploadAdmin();
      return { adminUserId: adminUser.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const fileUrl = resolveFileUrl(file);
      if (!fileUrl) {
        throw new UploadThingError("Upload did not return a valid file URL.");
      }

      const created = await db.mediaAsset.create({
        data: {
          type: MEDIA_TYPE.IMAGE,
          title: file.name,
          storageProvider: "uploadthing",
          storageKey: file.key,
          url: fileUrl,
          mimeType: file.type || "image/*",
          sizeBytes: file.size,
          originalFilename: file.name,
          uploadedByAdminId: metadata.adminUserId,
        },
        select: {
          id: true,
          type: true,
          url: true,
          title: true,
          originalFilename: true,
          mimeType: true,
          sizeBytes: true,
        },
      });

      return {
        mediaId: created.id,
        media: created,
      };
    }),

  mediaFile: f({
    blob: {
      maxFileCount: 6,
      maxFileSize: "16MB",
    },
  })
    .middleware(async () => {
      const adminUser = await requireUploadAdmin();
      return { adminUserId: adminUser.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const fileUrl = resolveFileUrl(file);
      if (!fileUrl) {
        throw new UploadThingError("Upload did not return a valid file URL.");
      }

      if (!ALLOWED_FILE_MIME_TYPES.has(file.type)) {
        throw new UploadThingError("Unsupported file type.");
      }

      const created = await db.mediaAsset.create({
        data: {
          type: MEDIA_TYPE.FILE,
          title: file.name,
          storageProvider: "uploadthing",
          storageKey: file.key,
          url: fileUrl,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          originalFilename: file.name,
          uploadedByAdminId: metadata.adminUserId,
        },
        select: {
          id: true,
          type: true,
          url: true,
          title: true,
          originalFilename: true,
          mimeType: true,
          sizeBytes: true,
        },
      });

      return {
        mediaId: created.id,
        media: created,
      };
    }),
} satisfies FileRouter;

export type BeyondBlogFileRouter = typeof beyondBlogFileRouter;
