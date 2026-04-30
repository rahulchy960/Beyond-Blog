import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_TYPE, MEDIA_TYPE, PUBLISH_STATUS } from "@/lib/content/enums";
import type { createTRPCContext } from "@/server/api/trpc";
import { createPrismaMock } from "@/tests/mocks/prisma";
import { userFactory } from "@/tests/factories";

const mocked = vi.hoisted(() => {
  return {
    findAdminByClerkUserId: vi.fn(),
    createAuditLog: vi.fn(async () => undefined),
    revalidateContentPaths: vi.fn(),
    revalidateCoursePaths: vi.fn(),
    revalidateQuizPaths: vi.fn(),
    revalidatePublicIndexes: vi.fn(),
    deleteProviderAsset: vi.fn(async () => undefined),
  };
});

vi.mock("@/lib/auth/admin-repository", () => ({
  findAdminByClerkUserId: mocked.findAdminByClerkUserId,
}));

vi.mock("@/server/audit/log", () => ({
  createAuditLog: mocked.createAuditLog,
}));

vi.mock("@/lib/cache/revalidate", () => ({
  revalidateContentPaths: mocked.revalidateContentPaths,
  revalidateCoursePaths: mocked.revalidateCoursePaths,
  revalidateQuizPaths: mocked.revalidateQuizPaths,
  revalidatePublicIndexes: mocked.revalidatePublicIndexes,
}));

vi.mock("@/server/media/provider", () => ({
  deleteProviderAsset: mocked.deleteProviderAsset,
}));

import { contentRouter } from "@/server/api/routers/content";
import { courseRouter } from "@/server/api/routers/course";
import { interactionRouter } from "@/server/api/routers/interaction";
import { mediaRouter } from "@/server/api/routers/media";

const toDb = (db: ReturnType<typeof createPrismaMock>) =>
  db as unknown as Awaited<ReturnType<typeof createTRPCContext>>["db"];

function createAdminCtx(db: ReturnType<typeof createPrismaMock>) {
  return {
    db: toDb(db),
    userId: "user_owner",
    sessionId: "sess_1",
    isAuthenticated: true,
  };
}

describe("tRPC admin integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.findAdminByClerkUserId.mockResolvedValue(
      userFactory({ clerkUserId: "user_owner", role: "OWNER", isActive: true }),
    );
  });

  it("creates content and writes audit entry", async () => {
    const db = createPrismaMock();
    db.content.findFirst.mockResolvedValue(null);
    db.content.create.mockResolvedValue({ id: "content_1" });
    db.content.findUniqueOrThrow.mockResolvedValue({
      id: "content_1",
      title: "New Content",
      slug: "new-content",
      summary: null,
      bodyJson: { type: "doc", content: [] },
      type: CONTENT_TYPE.ARTICLE,
      publishStatus: PUBLISH_STATUS.DRAFT,
      isFeatured: false,
      seoTitle: null,
      seoDescription: null,
      publishedAt: null,
      updatedAt: new Date(),
      createdAt: new Date(),
      categoryId: null,
      category: null,
      coverImageAssetId: null,
      coverImage: null,
      tags: [],
    });

    const caller = contentRouter.createCaller(createAdminCtx(db));
    const result = await caller.create({
      title: "New Content",
      slug: "new-content",
      summary: null,
      bodyJson: { type: "doc", content: [] },
      type: CONTENT_TYPE.ARTICLE,
      coverImageAssetId: null,
      categoryId: null,
      tagNames: [],
      isFeatured: false,
      seoTitle: null,
      seoDescription: null,
      publishStatus: PUBLISH_STATUS.DRAFT,
    });

    expect(result.id).toBe("content_1");
    expect(db.content.create).toHaveBeenCalledTimes(1);
    expect(mocked.createAuditLog).toHaveBeenCalledTimes(1);
  });

  it("updates content with conflict validation", async () => {
    const db = createPrismaMock();
    db.content.findUnique.mockResolvedValue({
      id: "content_1",
      slug: "old-slug",
      publishStatus: PUBLISH_STATUS.DRAFT,
      category: null,
      tags: [],
      coverImage: null,
    });
    db.content.findFirst.mockResolvedValue({ id: "existing" });

    const caller = contentRouter.createCaller(createAdminCtx(db));
    await expect(
      caller.update({
        id: "content_1",
        title: "Updated",
        slug: "existing-slug",
        summary: null,
        bodyJson: { type: "doc", content: [] },
        type: CONTENT_TYPE.ARTICLE,
        coverImageAssetId: null,
        categoryId: null,
        tagNames: [],
        isFeatured: false,
        seoTitle: null,
        seoDescription: null,
        publishStatus: PUBLISH_STATUS.DRAFT,
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("persists a selected content cover image", async () => {
    const db = createPrismaMock();
    const coverImage = {
      id: "media_cover_1",
      type: MEDIA_TYPE.IMAGE,
      url: "https://example.ufs.sh/f/media_cover_1",
      altText: "Cover",
    };

    db.content.findUnique.mockResolvedValue({
      id: "content_1",
      slug: "old-slug",
      publishedAt: null,
      category: null,
      tags: [],
      coverImage: null,
    });
    db.content.findFirst.mockResolvedValue(null);
    db.mediaAsset.findUnique.mockResolvedValue({ id: coverImage.id, type: MEDIA_TYPE.IMAGE });
    db.content.update.mockResolvedValue({ id: "content_1" });
    db.content.findUniqueOrThrow.mockResolvedValue({
      id: "content_1",
      title: "Updated",
      slug: "updated",
      summary: null,
      bodyJson: { type: "doc", content: [] },
      type: CONTENT_TYPE.ARTICLE,
      publishStatus: PUBLISH_STATUS.DRAFT,
      isFeatured: false,
      seoTitle: null,
      seoDescription: null,
      publishedAt: null,
      updatedAt: new Date(),
      createdAt: new Date(),
      categoryId: null,
      category: null,
      coverImageAssetId: coverImage.id,
      coverImage,
      tags: [],
    });

    const caller = contentRouter.createCaller(createAdminCtx(db));
    const result = await caller.update({
      id: "content_1",
      title: "Updated",
      slug: "updated",
      summary: null,
      bodyJson: { type: "doc", content: [] },
      type: CONTENT_TYPE.ARTICLE,
      coverImageAssetId: coverImage.id,
      categoryId: null,
      tagNames: [],
      isFeatured: false,
      seoTitle: null,
      seoDescription: null,
      publishStatus: PUBLISH_STATUS.DRAFT,
    });

    expect(result.coverImageAssetId).toBe(coverImage.id);
    expect(db.content.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          coverImageAssetId: coverImage.id,
        }),
      }),
    );
  });

  it("publishes and unpublishes content", async () => {
    const db = createPrismaMock();
    db.content.update
      .mockResolvedValueOnce({
        id: "content_1",
        publishStatus: PUBLISH_STATUS.PUBLISHED,
        slug: "new-content",
        type: CONTENT_TYPE.ARTICLE,
        category: null,
        tags: [],
      })
      .mockResolvedValueOnce({
        id: "content_1",
        publishStatus: PUBLISH_STATUS.DRAFT,
        slug: "new-content",
        type: CONTENT_TYPE.ARTICLE,
        category: null,
        tags: [],
      });

    const caller = contentRouter.createCaller(createAdminCtx(db));
    const published = await caller.publish({ id: "content_1" });
    const draft = await caller.unpublish({ id: "content_1" });

    expect(published.publishStatus).toBe(PUBLISH_STATUS.PUBLISHED);
    expect(draft.publishStatus).toBe(PUBLISH_STATUS.DRAFT);
    expect(mocked.revalidateContentPaths).toHaveBeenCalledTimes(2);
  });

  it("creates a course", async () => {
    const db = createPrismaMock();
    db.course.findFirst.mockResolvedValue(null);
    db.course.create.mockResolvedValue({
      id: "course_1",
      slug: "course-one",
      title: "Course One",
      summary: null,
      descriptionJson: null,
      coverImage: null,
      sections: [],
      lessons: [],
      status: "DRAFT",
      updatedAt: new Date(),
      createdAt: new Date(),
    });

    const caller = courseRouter.createCaller(createAdminCtx(db));
    const result = await caller.create({
      title: "Course One",
      slug: "course-one",
      summary: null,
      descriptionJson: null,
      coverImageId: null,
      difficultyLevel: null,
      estimatedDurationMinutes: null,
      isFeatured: false,
      seoTitle: null,
      seoDescription: null,
      status: "DRAFT",
    });

    expect(result.id).toBe("course_1");
    expect(db.course.create).toHaveBeenCalledTimes(1);
  });

  it("registers external media uploads", async () => {
    const db = createPrismaMock();
    db.mediaAsset.create.mockResolvedValue({
      id: "media_1",
      storageProvider: "uploadthing",
      url: "https://example.com/video.m3u8",
    });

    const caller = mediaRouter.createCaller(createAdminCtx(db));
    const result = await caller.createExternalVideo({
      title: "Video",
      provider: "uploadthing",
      providerAssetId: "asset_1",
      externalUrl: "https://example.com/video.m3u8",
      playbackUrl: null,
      thumbnailUrl: null,
      mimeType: "video/mp4",
      durationSeconds: 90,
    });

    expect(result.id).toBe("media_1");
    expect(db.mediaAsset.create).toHaveBeenCalledTimes(1);
  });

  it("registers uploaded media idempotently", async () => {
    const db = createPrismaMock();
    db.mediaAsset.findFirst.mockResolvedValue({ id: "media_upload_1" });
    db.mediaAsset.update.mockResolvedValue({
      id: "media_upload_1",
      type: MEDIA_TYPE.IMAGE,
      title: "cover.png",
      storageProvider: "uploadthing",
      storageKey: "ut_key_1",
      providerAssetId: "ut_key_1",
      externalUrl: null,
      playbackUrl: null,
      url: "https://example.ufs.sh/f/ut_key_1",
      thumbnailUrl: "https://example.ufs.sh/f/ut_key_1",
      altText: null,
      caption: null,
      mimeType: "image/png",
      sizeBytes: 1234,
      width: null,
      height: null,
      durationSeconds: null,
      originalFilename: "cover.png",
      contentId: null,
      uploadedByAdminId: "admin_1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const caller = mediaRouter.createCaller(createAdminCtx(db));
    const result = await caller.registerUploadedAsset({
      type: MEDIA_TYPE.IMAGE,
      title: "cover.png",
      storageProvider: "uploadthing",
      storageKey: "ut_key_1",
      url: "https://example.ufs.sh/f/ut_key_1",
      thumbnailUrl: "https://example.ufs.sh/f/ut_key_1",
      mimeType: "image/png",
      sizeBytes: 1234,
      originalFilename: "cover.png",
    });

    expect(result.id).toBe("media_upload_1");
    expect(db.mediaAsset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            {
              storageProvider: "uploadthing",
              storageKey: "ut_key_1",
            },
            {
              url: "https://example.ufs.sh/f/ut_key_1",
            },
          ],
        },
      }),
    );
    expect(db.mediaAsset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "media_upload_1",
        },
      }),
    );
  });

  it("registers UploadThing responses through registerUpload", async () => {
    const db = createPrismaMock();
    db.mediaAsset.findFirst.mockResolvedValue(null);
    db.mediaAsset.create.mockResolvedValue({
      id: "media_upload_2",
      type: MEDIA_TYPE.IMAGE,
      title: "hero.png",
      storageProvider: "uploadthing",
      storageKey: "ut_key_2",
      providerAssetId: "ut_key_2",
      externalUrl: null,
      playbackUrl: null,
      url: "https://example.ufs.sh/f/ut_key_2",
      thumbnailUrl: "https://example.ufs.sh/f/ut_key_2",
      altText: null,
      caption: null,
      mimeType: "image/png",
      sizeBytes: 2048,
      width: null,
      height: null,
      durationSeconds: null,
      originalFilename: "hero.png",
      contentId: null,
      uploadedByAdminId: "admin_1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const caller = mediaRouter.createCaller(createAdminCtx(db));
    const result = await caller.registerUpload({
      url: "https://example.ufs.sh/f/ut_key_2",
      key: "ut_key_2",
      name: "hero.png",
      size: 2048,
      mimeType: "image/png",
    });

    expect(result.id).toBe("media_upload_2");
    expect(result.url).toBe("https://example.ufs.sh/f/ut_key_2");
    expect(result.originalFilename).toBe("hero.png");
    expect(result.storageKey).toBe("ut_key_2");
    expect(db.mediaAsset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          storageProvider: "uploadthing",
          storageKey: "ut_key_2",
          url: "https://example.ufs.sh/f/ut_key_2",
          title: "hero.png",
          originalFilename: "hero.png",
          sizeBytes: 2048,
          mimeType: "image/png",
        }),
      }),
    );
  });

  it("uses the upload URL as registerUpload duplicate key fallback", async () => {
    const db = createPrismaMock();
    db.mediaAsset.findFirst.mockResolvedValue(null);
    db.mediaAsset.create.mockResolvedValue({
      id: "media_upload_3",
      type: MEDIA_TYPE.FILE,
      title: "notes.pdf",
      storageProvider: "uploadthing",
      storageKey: "https://example.ufs.sh/f/notes",
      providerAssetId: "https://example.ufs.sh/f/notes",
      externalUrl: null,
      playbackUrl: null,
      url: "https://example.ufs.sh/f/notes",
      thumbnailUrl: null,
      altText: null,
      caption: null,
      mimeType: "application/pdf",
      sizeBytes: 0,
      width: null,
      height: null,
      durationSeconds: null,
      originalFilename: "notes.pdf",
      contentId: null,
      uploadedByAdminId: "admin_1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const caller = mediaRouter.createCaller(createAdminCtx(db));
    const result = await caller.registerUpload({
      url: "https://example.ufs.sh/f/notes",
      name: "notes.pdf",
      mimeType: "application/pdf",
    });

    expect(result.storageKey).toBe("https://example.ufs.sh/f/notes");
    expect(db.mediaAsset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          storageProvider: "uploadthing",
          storageKey: "https://example.ufs.sh/f/notes",
        }),
      }),
    );
  });

  it("lists newly registered media assets first", async () => {
    const db = createPrismaMock();
    db.mediaAsset.findMany.mockResolvedValue([
      {
        id: "media_upload_1",
        type: MEDIA_TYPE.IMAGE,
        title: "cover.png",
        originalFilename: "cover.png",
        url: "https://example.ufs.sh/f/ut_key_1",
        thumbnailUrl: "https://example.ufs.sh/f/ut_key_1",
        altText: null,
        mimeType: "image/png",
        sizeBytes: 1234,
        width: null,
        height: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        contentId: null,
        storageProvider: "uploadthing",
        externalUrl: null,
        playbackUrl: null,
        caption: null,
        providerAssetId: "ut_key_1",
        content: null,
      },
    ]);

    const caller = mediaRouter.createCaller(createAdminCtx(db));
    const result = await caller.list({
      limit: 24,
      sort: "newest",
    });

    expect(result.items[0]?.id).toBe("media_upload_1");
    expect(db.mediaAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("moderates comments", async () => {
    const db = createPrismaMock();
    db.comment.update.mockResolvedValue({
      id: "comment_1",
      status: "VISIBLE",
    });

    const caller = interactionRouter.createCaller(createAdminCtx(db));
    const result = await caller.updateCommentStatus({
      commentId: "comment_1",
      status: "VISIBLE",
      moderationNote: "Looks good",
    });

    expect(result.status).toBe("VISIBLE");
    expect(db.comment.update).toHaveBeenCalledTimes(1);
  });
});
