import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import {
  COURSE_LESSON_ITEM_TYPE,
  COURSE_STATUS,
  MEDIA_TYPE,
} from "@/lib/content/enums";
import { buildHtmlFromRichText, normalizeRichTextDocument } from "@/lib/content/rich-text";
import { slugifyText } from "@/lib/content/slug";
import {
  attachLessonMediaInputSchema,
  courseByIdInputSchema,
  courseBySlugInputSchema,
  createCourseInputSchema,
  createCourseLessonInputSchema,
  createCourseSectionInputSchema,
  deleteCourseInputSchema,
  deleteCourseLessonInputSchema,
  deleteCourseSectionInputSchema,
  detachLessonMediaInputSchema,
  listAdminCoursesInputSchema,
  listPublicCoursesInputSchema,
  normalizeOptionalText,
  reorderCourseLessonsInputSchema,
  reorderCourseSectionsInputSchema,
  toggleCourseFeaturedInputSchema,
  updateCourseInputSchema,
  updateCourseLessonInputSchema,
  updateCourseSectionInputSchema,
  updateCourseStatusInputSchema,
} from "@/lib/course/schemas";
import { createTRPCRouter, adminProcedure, publicProcedure } from "@/server/api/trpc";
import { createAuditLog } from "@/server/audit/log";

function isMissingCourseTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      const text = String(error.message);
      return text.includes("Course") || text.includes("CourseSection") || text.includes("CourseLesson");
    }

    if (error.code === "P2010") {
      return String(error.message).includes("Course");
    }
  }

  return false;
}

const courseCoverSelect = {
  id: true,
  url: true,
  thumbnailUrl: true,
  altText: true,
  title: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true,
} as const;

const lessonMediaSelect = {
  id: true,
  type: true,
  url: true,
  thumbnailUrl: true,
  altText: true,
  title: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true,
  playbackUrl: true,
  externalUrl: true,
} as const;

const adminCourseInclude = {
  coverImage: {
    select: courseCoverSelect,
  },
  sections: {
    orderBy: {
      order: "asc" as const,
    },
    include: {
      lessons: {
        orderBy: {
          order: "asc" as const,
        },
        include: {
          mediaAsset: {
            select: lessonMediaSelect,
          },
        },
      },
    },
  },
  lessons: {
    where: {
      sectionId: null,
    },
    orderBy: {
      order: "asc" as const,
    },
    include: {
      mediaAsset: {
        select: lessonMediaSelect,
      },
    },
  },
} as const;

type DbLike = {
  course: {
    findFirst: (args: {
      where: {
        slug?: string;
        id?: { not: string };
      };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
  };
};

async function assertCourseSlugUnique(slug: string, db: DbLike, excludeId?: string) {
  const existing = await db.course.findFirst({
    where: {
      slug,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Another course already uses this slug.",
    });
  }
}

async function assertSectionBelongsToCourse(args: {
  db: {
    courseSection: {
      findUnique: (params: {
        where: { id: string };
        select: { id: true; courseId: true };
      }) => Promise<{ id: string; courseId: string } | null>;
    };
  };
  courseId: string;
  sectionId?: string | null;
}) {
  const sectionId = normalizeOptionalText(args.sectionId);
  if (!sectionId) {
    return null;
  }

  const section = await args.db.courseSection.findUnique({
    where: { id: sectionId },
    select: { id: true, courseId: true },
  });

  if (!section || section.courseId !== args.courseId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid section for this course.",
    });
  }

  return section.id;
}

async function assertCourseCoverImage(args: {
  db: {
    mediaAsset: {
      findUnique: (params: {
        where: { id: string };
        select: { id: true; type: true };
      }) => Promise<{ id: string; type: string } | null>;
    };
  };
  coverImageId?: string | null;
}) {
  const coverImageId = normalizeOptionalText(args.coverImageId);
  if (!coverImageId) {
    return null;
  }

  const media = await args.db.mediaAsset.findUnique({
    where: { id: coverImageId },
    select: { id: true, type: true },
  });

  if (!media || media.type !== MEDIA_TYPE.IMAGE) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Course cover image must reference an IMAGE media asset.",
    });
  }

  return media.id;
}

async function assertLessonMediaCompatible(args: {
  db: {
    mediaAsset: {
      findUnique: (params: {
        where: { id: string };
        select: { id: true; type: true };
      }) => Promise<{ id: string; type: string } | null>;
    };
  };
  mediaAssetId?: string | null;
  itemType: string;
}) {
  const mediaAssetId = normalizeOptionalText(args.mediaAssetId);
  if (!mediaAssetId) {
    return null;
  }

  const media = await args.db.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    select: { id: true, type: true },
  });

  if (!media) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Selected lesson media was not found.",
    });
  }

  if (args.itemType === COURSE_LESSON_ITEM_TYPE.IMAGE && media.type !== MEDIA_TYPE.IMAGE) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "IMAGE lessons require image media assets.",
    });
  }

  if (args.itemType === COURSE_LESSON_ITEM_TYPE.VIDEO && media.type !== MEDIA_TYPE.VIDEO) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "VIDEO lessons require video media assets.",
    });
  }

  if (args.itemType === COURSE_LESSON_ITEM_TYPE.RESOURCE && media.type !== MEDIA_TYPE.FILE) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "RESOURCE lessons require file media assets.",
    });
  }

  return media.id;
}

function validateLessonPayload(input: {
  itemType: string;
  bodyJson?: unknown;
  mediaAssetId?: string | null;
  externalUrl?: string | null;
}) {
  const hasMedia = Boolean(normalizeOptionalText(input.mediaAssetId));
  const hasExternalUrl = Boolean(normalizeOptionalText(input.externalUrl));

  if (input.itemType === COURSE_LESSON_ITEM_TYPE.RICH_TEXT) {
    return;
  }

  if (!hasMedia && !hasExternalUrl) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Non-text lessons require a media attachment or external URL.",
    });
  }

  if (
    (input.itemType === COURSE_LESSON_ITEM_TYPE.IMAGE ||
      input.itemType === COURSE_LESSON_ITEM_TYPE.VIDEO) &&
    !hasMedia &&
    !hasExternalUrl
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Image/video lessons require media or a URL.",
    });
  }
}

async function getNextSectionOrder(db: {
  courseSection: {
    findFirst: (args: {
      where: { courseId: string };
      orderBy: { order: "desc" };
      select: { order: true };
    }) => Promise<{ order: number } | null>;
  };
}, courseId: string) {
  const lastSection = await db.courseSection.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (lastSection?.order ?? 0) + 10;
}

async function getNextLessonOrder(
  db: {
    courseLesson: {
      findFirst: (args: {
        where: { courseId: string; sectionId: string | null };
        orderBy: { order: "desc" };
        select: { order: true };
      }) => Promise<{ order: number } | null>;
    };
  },
  courseId: string,
  sectionId: string | null,
) {
  const lastLesson = await db.courseLesson.findFirst({
    where: {
      courseId,
      sectionId,
    },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (lastLesson?.order ?? 0) + 10;
}

async function assertLessonSlugUnique(args: {
  db: {
    courseLesson: {
      findFirst: (params: {
        where: {
          courseId: string;
          slug: string;
          id?: { not: string };
        };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
  };
  courseId: string;
  slug?: string | null;
  excludeId?: string;
}) {
  const slug = normalizeOptionalText(args.slug);
  if (!slug) {
    return null;
  }

  const existing = await args.db.courseLesson.findFirst({
    where: {
      courseId: args.courseId,
      slug,
      ...(args.excludeId ? { id: { not: args.excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Another lesson in this course already uses this slug.",
    });
  }

  return slug;
}

function normalizeCoursePayload<T extends { descriptionJson: unknown }>(course: T) {
  return {
    ...course,
    descriptionJson: course.descriptionJson
      ? normalizeRichTextDocument(course.descriptionJson)
      : null,
  };
}

function normalizeLessonBody<T extends { bodyJson: unknown }>(lesson: T) {
  return {
    ...lesson,
    bodyJson: lesson.bodyJson ? normalizeRichTextDocument(lesson.bodyJson) : null,
  };
}

export const courseRouter = createTRPCRouter({
  create: adminProcedure.input(createCourseInputSchema).mutation(async ({ ctx, input }) => {
    const slug = slugifyText(input.slug);
    if (!slug) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Course slug is required.",
      });
    }

    await assertCourseSlugUnique(slug, ctx.db);

    const coverImageId = await assertCourseCoverImage({
      db: ctx.db,
      coverImageId: input.coverImageId,
    });

    const descriptionJson = input.descriptionJson
      ? normalizeRichTextDocument(input.descriptionJson)
      : undefined;

    const created = await ctx.db.course.create({
      data: {
        title: input.title.trim(),
        slug,
        summary: normalizeOptionalText(input.summary),
        descriptionJson,
        descriptionHtml: descriptionJson ? buildHtmlFromRichText(descriptionJson) : null,
        coverImageId,
        difficultyLevel: input.difficultyLevel ?? null,
        estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
        isFeatured: input.isFeatured,
        status: input.status,
        seoTitle: normalizeOptionalText(input.seoTitle),
        seoDescription: normalizeOptionalText(input.seoDescription),
        publishedAt: input.status === COURSE_STATUS.PUBLISHED ? new Date() : null,
        createdByAdminId: ctx.adminUser.id,
      },
      include: adminCourseInclude,
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "course.create",
      entityType: "COURSE",
      entityId: created.id,
      metadata: {
        title: created.title,
        status: created.status,
      },
    });

    return normalizeCoursePayload(created);
  }),

  update: adminProcedure.input(updateCourseInputSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.course.findUnique({
      where: { id: input.id },
      include: {
        coverImage: {
          select: courseCoverSelect,
        },
      },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Course not found.",
      });
    }

    const slug = slugifyText(input.slug);
    if (!slug) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Course slug is required.",
      });
    }

    await assertCourseSlugUnique(slug, ctx.db, input.id);

    const coverImageId = await assertCourseCoverImage({
      db: ctx.db,
      coverImageId: input.coverImageId,
    });

    const descriptionJson = input.descriptionJson
      ? normalizeRichTextDocument(input.descriptionJson)
      : undefined;

    const updated = await ctx.db.course.update({
      where: { id: input.id },
      data: {
        title: input.title.trim(),
        slug,
        summary: normalizeOptionalText(input.summary),
        descriptionJson,
        descriptionHtml: descriptionJson ? buildHtmlFromRichText(descriptionJson) : null,
        coverImageId,
        difficultyLevel: input.difficultyLevel ?? null,
        estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
        isFeatured: input.isFeatured,
        status: input.status,
        seoTitle: normalizeOptionalText(input.seoTitle),
        seoDescription: normalizeOptionalText(input.seoDescription),
        publishedAt:
          input.status === COURSE_STATUS.PUBLISHED
            ? existing.publishedAt ?? new Date()
            : null,
      },
      include: adminCourseInclude,
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "course.update",
      entityType: "COURSE",
      entityId: updated.id,
      metadata: {
        title: updated.title,
        status: updated.status,
      },
    });

    return normalizeCoursePayload(updated);
  }),

  delete: adminProcedure.input(deleteCourseInputSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.course.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        title: true,
      },
    });

    await ctx.db.course.delete({
      where: { id: input.id },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "course.delete",
      entityType: "COURSE",
      entityId: input.id,
      metadata: {
        title: existing?.title ?? null,
      },
    });

    return { id: input.id };
  }),

  listForAdmin: adminProcedure.input(listAdminCoursesInputSchema).query(async ({ ctx, input }) => {
    const items = await ctx.db.course.findMany({
      where: {
        ...(input.status ? { status: input.status } : {}),
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
                    mode: "insensitive",
                  },
                },
                {
                  summary: {
                    contains: input.query,
                    mode: "insensitive",
                  },
                },
                {
                  slug: {
                    contains: input.query,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      take: input.limit,
      include: {
        coverImage: {
          select: courseCoverSelect,
        },
        _count: {
          select: {
            sections: true,
            lessons: true,
          },
        },
      },
    });

    return { items };
  }),

  getById: adminProcedure.input(courseByIdInputSchema).query(async ({ ctx, input }) => {
    const course = await ctx.db.course.findUnique({
      where: { id: input.id },
      include: adminCourseInclude,
    });

    if (!course) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Course not found.",
      });
    }

    return {
      ...normalizeCoursePayload(course),
      sections: course.sections.map((section) => ({
        ...section,
        lessons: section.lessons.map((lesson) => normalizeLessonBody(lesson)),
      })),
      lessons: course.lessons.map((lesson) => normalizeLessonBody(lesson)),
    };
  }),

  publish: adminProcedure.input(updateCourseStatusInputSchema).mutation(async ({ ctx, input }) => {
    const updated = await ctx.db.course.update({
      where: { id: input.id },
      data: {
        status: COURSE_STATUS.PUBLISHED,
        publishedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "course.publish",
      entityType: "COURSE",
      entityId: updated.id,
      metadata: {
        status: updated.status,
      },
    });

    return updated;
  }),

  unpublish: adminProcedure.input(updateCourseStatusInputSchema).mutation(async ({ ctx, input }) => {
    const updated = await ctx.db.course.update({
      where: { id: input.id },
      data: {
        status: COURSE_STATUS.DRAFT,
        publishedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "course.move_to_draft",
      entityType: "COURSE",
      entityId: updated.id,
      metadata: {
        status: updated.status,
      },
    });

    return updated;
  }),

  archive: adminProcedure.input(updateCourseStatusInputSchema).mutation(async ({ ctx, input }) => {
    const updated = await ctx.db.course.update({
      where: { id: input.id },
      data: {
        status: COURSE_STATUS.ARCHIVED,
      },
      select: {
        id: true,
        status: true,
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "course.archive",
      entityType: "COURSE",
      entityId: updated.id,
      metadata: {
        status: updated.status,
      },
    });

    return updated;
  }),

  toggleFeatured: adminProcedure
    .input(toggleCourseFeaturedInputSchema)
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db.course.findUnique({
        where: { id: input.id },
        select: { isFeatured: true },
      });

      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found.",
        });
      }

      const updated = await ctx.db.course.update({
        where: { id: input.id },
        data: {
          isFeatured: input.value ?? !current.isFeatured,
        },
        select: {
          id: true,
          isFeatured: true,
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "course.toggle_featured",
        entityType: "COURSE",
        entityId: updated.id,
        metadata: {
          isFeatured: updated.isFeatured,
        },
      });

      return updated;
    }),

  createSection: adminProcedure
    .input(createCourseSectionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.courseId },
        select: { id: true },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found.",
        });
      }

      const order = await getNextSectionOrder(ctx.db, input.courseId);

      const section = await ctx.db.courseSection.create({
        data: {
          courseId: input.courseId,
          title: input.title.trim(),
          description: normalizeOptionalText(input.description),
          order,
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "course.section.create",
        entityType: "COURSE_SECTION",
        entityId: section.id,
        metadata: {
          courseId: input.courseId,
          title: section.title,
        },
      });

      return section;
    }),

  updateSection: adminProcedure
    .input(updateCourseSectionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const section = await ctx.db.courseSection.update({
        where: { id: input.id },
        data: {
          title: input.title.trim(),
          description: normalizeOptionalText(input.description),
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "course.section.update",
        entityType: "COURSE_SECTION",
        entityId: section.id,
        metadata: {
          courseId: section.courseId,
          title: section.title,
        },
      });

      return section;
    }),

  deleteSection: adminProcedure
    .input(deleteCourseSectionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.courseSection.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          courseId: true,
          title: true,
        },
      });

      await ctx.db.courseLesson.updateMany({
        where: {
          sectionId: input.id,
        },
        data: {
          sectionId: null,
        },
      });

      await ctx.db.courseSection.delete({
        where: { id: input.id },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "course.section.delete",
        entityType: "COURSE_SECTION",
        entityId: input.id,
        metadata: {
          courseId: existing?.courseId ?? null,
          title: existing?.title ?? null,
        },
      });

      return { id: input.id };
    }),

  reorderSections: adminProcedure
    .input(reorderCourseSectionsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const uniqueIds = Array.from(new Set(input.sectionIds));
      if (uniqueIds.length !== input.sectionIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Section reorder payload contains duplicates.",
        });
      }

      const existing = await ctx.db.courseSection.findMany({
        where: {
          courseId: input.courseId,
          id: {
            in: input.sectionIds,
          },
        },
        select: {
          id: true,
        },
      });

      if (existing.length !== input.sectionIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more sections are invalid for this course.",
        });
      }

      await ctx.db.$transaction(
        input.sectionIds.map((sectionId, index) =>
          ctx.db.courseSection.update({
            where: { id: sectionId },
            data: { order: (index + 1) * 10 },
          }),
        ),
      );

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "course.section.reorder",
        entityType: "COURSE",
        entityId: input.courseId,
        metadata: {
          sectionIds: input.sectionIds,
        },
      });

      return { success: true };
    }),

  createLesson: adminProcedure
    .input(createCourseLessonInputSchema)
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.courseId },
        select: { id: true },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found.",
        });
      }

      validateLessonPayload(input);

      const sectionId = await assertSectionBelongsToCourse({
        db: ctx.db,
        courseId: input.courseId,
        sectionId: input.sectionId,
      });

      const mediaAssetId = await assertLessonMediaCompatible({
        db: ctx.db,
        mediaAssetId: input.mediaAssetId,
        itemType: input.itemType,
      });

      const slug = await assertLessonSlugUnique({
        db: ctx.db,
        courseId: input.courseId,
        slug: slugifyText(normalizeOptionalText(input.slug) ?? ""),
      });

      const bodyJson =
        input.itemType === COURSE_LESSON_ITEM_TYPE.RICH_TEXT && input.bodyJson
          ? normalizeRichTextDocument(input.bodyJson)
          : undefined;

      const order = await getNextLessonOrder(ctx.db, input.courseId, sectionId);

      const lesson = await ctx.db.courseLesson.create({
        data: {
          courseId: input.courseId,
          sectionId,
          title: input.title.trim(),
          slug,
          summary: normalizeOptionalText(input.summary),
          order,
          itemType: input.itemType,
          bodyJson,
          bodyHtml: bodyJson ? buildHtmlFromRichText(bodyJson) : null,
          mediaAssetId,
          externalUrl: normalizeOptionalText(input.externalUrl),
          durationMinutes: input.durationMinutes ?? null,
          isPreview: input.isPreview,
          publishedAt: input.isPublished ? new Date() : null,
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "course.lesson.create",
        entityType: "COURSE_LESSON",
        entityId: lesson.id,
        metadata: {
          courseId: input.courseId,
          title: lesson.title,
          itemType: lesson.itemType,
        },
      });

      return lesson;
    }),

  updateLesson: adminProcedure
    .input(updateCourseLessonInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.courseLesson.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          courseId: true,
          publishedAt: true,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson not found.",
        });
      }

      validateLessonPayload(input);

      const sectionId = await assertSectionBelongsToCourse({
        db: ctx.db,
        courseId: input.courseId,
        sectionId: input.sectionId,
      });

      const mediaAssetId = await assertLessonMediaCompatible({
        db: ctx.db,
        mediaAssetId: input.mediaAssetId,
        itemType: input.itemType,
      });

      const normalizedSlugInput = normalizeOptionalText(input.slug);
      const slug = await assertLessonSlugUnique({
        db: ctx.db,
        courseId: input.courseId,
        slug: normalizedSlugInput ? slugifyText(normalizedSlugInput) : null,
        excludeId: input.id,
      });

      const bodyJson =
        input.itemType === COURSE_LESSON_ITEM_TYPE.RICH_TEXT && input.bodyJson
          ? normalizeRichTextDocument(input.bodyJson)
          : undefined;

      const lesson = await ctx.db.courseLesson.update({
        where: { id: input.id },
        data: {
          courseId: input.courseId,
          sectionId,
          title: input.title.trim(),
          slug,
          summary: normalizeOptionalText(input.summary),
          itemType: input.itemType,
          bodyJson,
          bodyHtml: bodyJson ? buildHtmlFromRichText(bodyJson) : null,
          mediaAssetId,
          externalUrl: normalizeOptionalText(input.externalUrl),
          durationMinutes: input.durationMinutes ?? null,
          isPreview: input.isPreview,
          publishedAt: input.isPublished ? existing.publishedAt ?? new Date() : null,
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "course.lesson.update",
        entityType: "COURSE_LESSON",
        entityId: lesson.id,
        metadata: {
          courseId: lesson.courseId,
          title: lesson.title,
          itemType: lesson.itemType,
        },
      });

      return lesson;
    }),

  deleteLesson: adminProcedure
    .input(deleteCourseLessonInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.courseLesson.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          courseId: true,
          title: true,
          itemType: true,
        },
      });

      await ctx.db.courseLesson.delete({
        where: { id: input.id },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "course.lesson.delete",
        entityType: "COURSE_LESSON",
        entityId: input.id,
        metadata: {
          courseId: existing?.courseId ?? null,
          title: existing?.title ?? null,
          itemType: existing?.itemType ?? null,
        },
      });

      return { id: input.id };
    }),

  reorderLessons: adminProcedure
    .input(reorderCourseLessonsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const uniqueIds = Array.from(new Set(input.lessonIds));
      if (uniqueIds.length !== input.lessonIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Lesson reorder payload contains duplicates.",
        });
      }

      const sectionId = normalizeOptionalText(input.sectionId);

      const existing = await ctx.db.courseLesson.findMany({
        where: {
          courseId: input.courseId,
          sectionId,
          id: {
            in: input.lessonIds,
          },
        },
        select: {
          id: true,
        },
      });

      if (existing.length !== input.lessonIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more lessons are invalid for this section.",
        });
      }

      await ctx.db.$transaction(
        input.lessonIds.map((lessonId, index) =>
          ctx.db.courseLesson.update({
            where: { id: lessonId },
            data: {
              order: (index + 1) * 10,
            },
          }),
        ),
      );

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "course.lesson.reorder",
        entityType: "COURSE",
        entityId: input.courseId,
        metadata: {
          lessonIds: input.lessonIds,
          sectionId,
        },
      });

      return { success: true };
    }),

  attachLessonMedia: adminProcedure
    .input(attachLessonMediaInputSchema)
    .mutation(async ({ ctx, input }) => {
      const lesson = await ctx.db.courseLesson.findUnique({
        where: { id: input.lessonId },
        select: {
          id: true,
          itemType: true,
        },
      });

      if (!lesson) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson not found.",
        });
      }

      const mediaAssetId = await assertLessonMediaCompatible({
        db: ctx.db,
        mediaAssetId: input.mediaAssetId,
        itemType: lesson.itemType,
      });

      const updated = await ctx.db.courseLesson.update({
        where: { id: input.lessonId },
        data: {
          mediaAssetId,
        },
        select: {
          id: true,
          mediaAssetId: true,
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "course.lesson.attach_media",
        entityType: "COURSE_LESSON",
        entityId: updated.id,
        metadata: {
          mediaAssetId: updated.mediaAssetId,
        },
      });

      return updated;
    }),

  detachLessonMedia: adminProcedure
    .input(detachLessonMediaInputSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.courseLesson.update({
        where: { id: input.lessonId },
        data: {
          mediaAssetId: null,
        },
        select: {
          id: true,
          mediaAssetId: true,
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "course.lesson.detach_media",
        entityType: "COURSE_LESSON",
        entityId: updated.id,
      });

      return updated;
    }),

  listPublished: publicProcedure
    .input(listPublicCoursesInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        return ctx.db.course.findMany({
          where: {
            status: COURSE_STATUS.PUBLISHED,
            ...(input.featuredOnly ? { isFeatured: true } : {}),
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
          orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
          take: input.limit,
          include: {
            coverImage: {
              select: courseCoverSelect,
            },
            _count: {
              select: {
                sections: true,
                lessons: true,
              },
            },
          },
        });
      } catch (error) {
        if (isMissingCourseTableError(error)) {
          // Fallback for environments where course migrations haven't run yet.
          return [];
        }
        throw error;
      }
    }),

  getPublishedBySlug: publicProcedure
    .input(courseBySlugInputSchema)
    .query(async ({ ctx, input }) => {
      const course = await (async () => {
        try {
          return await ctx.db.course.findFirst({
            where: {
              slug: input.slug,
              status: COURSE_STATUS.PUBLISHED,
            },
            include: {
              coverImage: {
                select: courseCoverSelect,
              },
              sections: {
                orderBy: {
                  order: "asc",
                },
                include: {
                  lessons: {
                    where: {
                      publishedAt: {
                        not: null,
                      },
                    },
                    orderBy: {
                      order: "asc",
                    },
                    include: {
                      mediaAsset: {
                        select: lessonMediaSelect,
                      },
                    },
                  },
                },
              },
              lessons: {
                where: {
                  sectionId: null,
                  publishedAt: {
                    not: null,
                  },
                },
                orderBy: {
                  order: "asc",
                },
                include: {
                  mediaAsset: {
                    select: lessonMediaSelect,
                  },
                },
              },
            },
          });
        } catch (error) {
          if (isMissingCourseTableError(error)) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Published course not found.",
            });
          }
          throw error;
        }
      })();

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Published course not found.",
        });
      }

      return {
        ...normalizeCoursePayload(course),
        sections: course.sections.map((section) => ({
          ...section,
          lessons: section.lessons.map((lesson) => normalizeLessonBody(lesson)),
        })),
        lessons: course.lessons.map((lesson) => normalizeLessonBody(lesson)),
      };
    }),
});

