import { Prisma, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { MEDIA_TYPE, QUIZ_QUESTION_TYPE, QUIZ_STATUS } from "@/lib/content/enums";
import { slugifyText } from "@/lib/content/slug";
import {
  createQuizInputSchema,
  createQuizOptionInputSchema,
  createQuizQuestionInputSchema,
  deleteQuizInputSchema,
  deleteQuizOptionInputSchema,
  deleteQuizQuestionInputSchema,
  listAdminQuizzesInputSchema,
  listPublishedQuizzesInputSchema,
  listQuizAttemptsInputSchema,
  quizAnalyticsInputSchema,
  quizByIdInputSchema,
  quizBySlugInputSchema,
  reorderQuizOptionsInputSchema,
  reorderQuizQuestionsInputSchema,
  startQuizAttemptInputSchema,
  submitQuizAttemptInputSchema,
  toggleQuizFeaturedInputSchema,
  updateQuizInputSchema,
  updateQuizOptionInputSchema,
  updateQuizQuestionInputSchema,
  updateQuizStatusInputSchema,
  normalizeOptionalText,
} from "@/lib/quiz/schemas";
import { createTRPCRouter, adminProcedure, publicProcedure } from "@/server/api/trpc";
import { getVisitorTokenHash } from "@/lib/interaction/visitor";
import { createAuditLog } from "@/server/audit/log";

function isMissingQuizSchemaError(error: unknown) {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : String(error ?? "");
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  if (message.includes('relation "Quiz" does not exist')) {
    return true;
  }

  if (
    message.includes("does not exist in the current database") ||
    message.includes("The column `(not available)` does not exist") ||
    (message.includes("column") && message.includes("does not exist"))
  ) {
    return true;
  }

  if (code === "P2021" || code === "P2022" || code === "P2010") {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return true;
    }

    if (error.code === "P2010") {
      return (
        message.includes("Quiz") ||
        message.includes("QuizQuestion") ||
        message.includes("QuizOption") ||
        message.includes("QuizAttempt") ||
        message.includes("QuizAnswer")
      );
    }
  }

  return false;
}

function isQuizIncludeFallbackError(error: unknown) {
  const message = String(error ?? "");
  if (!message.includes("for include statement on model `Quiz`")) {
    return false;
  }

  return (
    message.includes("Unknown field `coverImage`") ||
    message.includes("Unknown field `course`") ||
    message.includes("Unknown field `courseLesson`")
  );
}

function isMissingTableError(error: unknown, tableNames: string[]) {
  const message = String(error ?? "");
  const hasKnownCode =
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2010");
  if (!hasKnownCode && !message.includes("does not exist")) {
    return false;
  }

  return tableNames.some((tableName) => message.includes(tableName));
}

let quizReadSchemaState: "unknown" | "ready" | "missing" = "unknown";

async function hasQuizReadSchema(
  db: Pick<PrismaClient, "$queryRaw">,
) {
  if (quizReadSchemaState === "ready") {
    return true;
  }

  if (quizReadSchemaState === "missing") {
    return false;
  }

  try {
    const rows = await db.$queryRaw<Array<{ columnName: string }>>`
      SELECT "column_name" AS "columnName"
      FROM "information_schema"."columns"
      WHERE "table_schema" = 'public'
        AND "table_name" = 'Quiz'
        AND "column_name" IN (
          'id',
          'title',
          'slug',
          'description',
          'status',
          'isFeatured',
          'publishedAt',
          'updatedAt'
        )
    `;

    const found = new Set(rows.map((row) => row.columnName));
    const required = [
      "id",
      "title",
      "slug",
      "description",
      "status",
      "isFeatured",
      "publishedAt",
      "updatedAt",
    ];
    const ready = required.every((column) => found.has(column));
    quizReadSchemaState = ready ? "ready" : "missing";
    return ready;
  } catch {
    quizReadSchemaState = "missing";
    return false;
  }
}

async function assertQuizSlugUnique(args: {
  db: {
    quiz: {
      findFirst: (params: {
        where: {
          slug: string;
          id?: { not: string };
        };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
  };
  slug: string;
  excludeId?: string;
}) {
  const existing = await args.db.quiz.findFirst({
    where: {
      slug: args.slug,
      ...(args.excludeId ? { id: { not: args.excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Another quiz already uses this slug.",
    });
  }
}

async function resolveQuizCoverImage(args: {
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
      message: "Quiz cover image must reference an IMAGE media asset.",
    });
  }

  return media.id;
}

async function resolveQuizLinkTargets(args: {
  db: {
    content: {
      findUnique: (params: {
        where: { id: string };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
    course: {
      findUnique: (params: {
        where: { id: string };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
    courseLesson: {
      findUnique: (params: {
        where: { id: string };
        select: { id: true; courseId: true };
      }) => Promise<{ id: string; courseId: string } | null>;
    };
  };
  contentId?: string | null;
  courseId?: string | null;
  courseLessonId?: string | null;
}) {
  const contentId = normalizeOptionalText(args.contentId);
  let courseId = normalizeOptionalText(args.courseId);
  const courseLessonId = normalizeOptionalText(args.courseLessonId);

  if (contentId) {
    const content = await args.db.content.findUnique({
      where: { id: contentId },
      select: { id: true },
    });

    if (!content) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Linked content was not found.",
      });
    }
  }

  if (courseId) {
    const course = await args.db.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Linked course was not found.",
      });
    }
  }

  if (courseLessonId) {
    const lesson = await args.db.courseLesson.findUnique({
      where: { id: courseLessonId },
      select: { id: true, courseId: true },
    });

    if (!lesson) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Linked lesson was not found.",
      });
    }

    if (courseId && courseId !== lesson.courseId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Linked lesson must belong to the selected course.",
      });
    }

    courseId = lesson.courseId;
  }

  return {
    contentId,
    courseId,
    courseLessonId,
  };
}

async function getNextQuestionPosition(db: {
  quizQuestion: {
    findFirst: (params: {
      where: { quizId: string };
      orderBy: { position: "desc" };
      select: { position: true };
    }) => Promise<{ position: number } | null>;
  };
}, quizId: string) {
  const last = await db.quizQuestion.findFirst({
    where: { quizId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  return (last?.position ?? 0) + 10;
}

async function getNextOptionPosition(db: {
  quizOption: {
    findFirst: (params: {
      where: { questionId: string };
      orderBy: { position: "desc" };
      select: { position: true };
    }) => Promise<{ position: number } | null>;
  };
}, questionId: string) {
  const last = await db.quizOption.findFirst({
    where: { questionId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  return (last?.position ?? 0) + 10;
}

const quizCoverSelect = {
  id: true,
  url: true,
  thumbnailUrl: true,
  altText: true,
} as const;

const adminQuizInclude = {
  coverImage: {
    select: quizCoverSelect,
  },
  content: {
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
    },
  },
  course: {
    select: {
      id: true,
      title: true,
      slug: true,
    },
  },
  courseLesson: {
    select: {
      id: true,
      title: true,
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  },
  questions: {
    orderBy: {
      position: "asc" as const,
    },
    include: {
      options: {
        orderBy: {
          position: "asc" as const,
        },
      },
    },
  },
  _count: {
    select: {
      questions: true,
      attempts: true,
    },
  },
} as const;

export const quizRouter = createTRPCRouter({
  create: adminProcedure.input(createQuizInputSchema).mutation(async ({ ctx, input }) => {
    const slug = slugifyText(input.slug);
    if (!slug) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Quiz slug is required.",
      });
    }

    await assertQuizSlugUnique({ db: ctx.db, slug });
    const coverImageId = await resolveQuizCoverImage({
      db: ctx.db,
      coverImageId: input.coverImageId,
    });
    const linkedTargets = await resolveQuizLinkTargets({
      db: ctx.db,
      contentId: input.contentId,
      courseId: input.courseId,
      courseLessonId: input.courseLessonId,
    });

    const created = await ctx.db.quiz.create({
      data: {
        title: input.title.trim(),
        slug,
        description: normalizeOptionalText(input.description),
        status: input.status,
        isFeatured: input.isFeatured,
        showAnswersAfterSubmit: input.showAnswersAfterSubmit,
        allowMultipleAttempts: input.allowMultipleAttempts,
        timeLimitMinutes: input.timeLimitMinutes ?? null,
        passingScore: input.passingScore ?? null,
        contentId: linkedTargets.contentId,
        courseId: linkedTargets.courseId,
        courseLessonId: linkedTargets.courseLessonId,
        coverImageId,
        seoTitle: normalizeOptionalText(input.seoTitle),
        seoDescription: normalizeOptionalText(input.seoDescription),
        createdByAdminId: ctx.adminUser.id,
        publishedAt: input.status === QUIZ_STATUS.PUBLISHED ? new Date() : null,
      },
      select: {
        id: true,
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "quiz.create",
      entityType: "QUIZ",
      entityId: created.id,
      metadata: {
        title: input.title.trim(),
        status: input.status,
      },
    });

    return created;
  }),

  update: adminProcedure.input(updateQuizInputSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.quiz.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        publishedAt: true,
      },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Quiz not found.",
      });
    }

    const slug = slugifyText(input.slug);
    if (!slug) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Quiz slug is required.",
      });
    }

    await assertQuizSlugUnique({
      db: ctx.db,
      slug,
      excludeId: input.id,
    });

    const coverImageId = await resolveQuizCoverImage({
      db: ctx.db,
      coverImageId: input.coverImageId,
    });
    const linkedTargets = await resolveQuizLinkTargets({
      db: ctx.db,
      contentId: input.contentId,
      courseId: input.courseId,
      courseLessonId: input.courseLessonId,
    });

    const updated = await ctx.db.quiz.update({
      where: { id: input.id },
      data: {
        title: input.title.trim(),
        slug,
        description: normalizeOptionalText(input.description),
        status: input.status,
        isFeatured: input.isFeatured,
        showAnswersAfterSubmit: input.showAnswersAfterSubmit,
        allowMultipleAttempts: input.allowMultipleAttempts,
        timeLimitMinutes: input.timeLimitMinutes ?? null,
        passingScore: input.passingScore ?? null,
        contentId: linkedTargets.contentId,
        courseId: linkedTargets.courseId,
        courseLessonId: linkedTargets.courseLessonId,
        coverImageId,
        seoTitle: normalizeOptionalText(input.seoTitle),
        seoDescription: normalizeOptionalText(input.seoDescription),
        publishedAt:
          input.status === QUIZ_STATUS.PUBLISHED
            ? existing.publishedAt ?? new Date()
            : null,
      },
      select: {
        id: true,
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "quiz.update",
      entityType: "QUIZ",
      entityId: updated.id,
      metadata: {
        title: input.title.trim(),
        status: input.status,
      },
    });

    return updated;
  }),

  delete: adminProcedure.input(deleteQuizInputSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.quiz.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        title: true,
      },
    });

    await ctx.db.quiz.delete({
      where: { id: input.id },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "quiz.delete",
      entityType: "QUIZ",
      entityId: input.id,
      metadata: {
        title: existing?.title ?? null,
      },
    });

    return { id: input.id };
  }),

  listForAdmin: adminProcedure.input(listAdminQuizzesInputSchema).query(async ({ ctx, input }) => {
    if (!(await hasQuizReadSchema(ctx.db))) {
      return { items: [] };
    }

    const where = {
      ...(input.status ? { status: input.status } : {}),
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
                slug: {
                  contains: input.query,
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: input.query,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };
    const orderBy =
      input.sort === "newest"
        ? [{ createdAt: "desc" as const }]
        : [{ updatedAt: "desc" as const }, { createdAt: "desc" as const }];

    let items;
    try {
      items = await ctx.db.quiz.findMany({
        where,
        orderBy,
        take: input.limit,
        include: {
          coverImage: {
            select: quizCoverSelect,
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      });
    } catch (error) {
      if (isMissingQuizSchemaError(error)) {
        return { items: [] };
      }

      if (!isQuizIncludeFallbackError(error)) {
        throw error;
      }

      try {
        const fallbackItems = await ctx.db.quiz.findMany({
          where,
          orderBy,
          take: input.limit,
          include: {
            _count: {
              select: {
                questions: true,
                attempts: true,
              },
            },
          },
        });

        items = fallbackItems.map((item) => ({
          ...item,
          coverImage: null,
        }));
      } catch (fallbackError) {
        if (isMissingQuizSchemaError(fallbackError)) {
          return { items: [] };
        }

        throw fallbackError;
      }
    }

    return { items };
  }),

  getById: adminProcedure.input(quizByIdInputSchema).query(async ({ ctx, input }) => {
    const attemptsInclude = {
      attempts: {
        where: {
          submittedAt: {
            not: null,
          },
        },
        take: 12,
        orderBy: [{ submittedAt: "desc" as const }],
        select: {
          id: true,
          guestName: true,
          guestEmail: true,
          startedAt: true,
          submittedAt: true,
          score: true,
          totalPoints: true,
          passed: true,
        },
      },
    };

    const quiz = await (async () => {
      try {
        return await ctx.db.quiz.findUnique({
          where: { id: input.id },
          include: {
            ...adminQuizInclude,
            ...attemptsInclude,
          },
        });
      } catch (error) {
        if (!isQuizIncludeFallbackError(error)) {
          throw error;
        }

        const fallbackQuiz = await ctx.db.quiz.findUnique({
          where: { id: input.id },
          include: {
            content: adminQuizInclude.content,
            questions: adminQuizInclude.questions,
            _count: adminQuizInclude._count,
            ...attemptsInclude,
          },
        });

        if (!fallbackQuiz) {
          return null;
        }

        return {
          ...fallbackQuiz,
          coverImage: null,
          course: null,
          courseLesson: null,
        };
      }
    })();

    if (!quiz) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Quiz not found.",
      });
    }

    return quiz;
  }),

  publish: adminProcedure.input(updateQuizStatusInputSchema).mutation(async ({ ctx, input }) => {
    const updated = await ctx.db.quiz.update({
      where: { id: input.id },
      data: {
        status: QUIZ_STATUS.PUBLISHED,
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
      action: "quiz.publish",
      entityType: "QUIZ",
      entityId: updated.id,
      metadata: {
        status: updated.status,
      },
    });

    return updated;
  }),

  moveToDraft: adminProcedure.input(updateQuizStatusInputSchema).mutation(async ({ ctx, input }) => {
    const updated = await ctx.db.quiz.update({
      where: { id: input.id },
      data: {
        status: QUIZ_STATUS.DRAFT,
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
      action: "quiz.move_to_draft",
      entityType: "QUIZ",
      entityId: updated.id,
      metadata: {
        status: updated.status,
      },
    });

    return updated;
  }),

  closeQuiz: adminProcedure.input(updateQuizStatusInputSchema).mutation(async ({ ctx, input }) => {
    const updated = await ctx.db.quiz.update({
      where: { id: input.id },
      data: {
        status: QUIZ_STATUS.CLOSED,
      },
      select: {
        id: true,
        status: true,
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "quiz.close",
      entityType: "QUIZ",
      entityId: updated.id,
      metadata: {
        status: updated.status,
      },
    });

    return updated;
  }),

  toggleFeatured: adminProcedure
    .input(toggleQuizFeaturedInputSchema)
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db.quiz.findUnique({
        where: { id: input.id },
        select: { isFeatured: true },
      });

      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quiz not found.",
        });
      }

      const updated = await ctx.db.quiz.update({
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
        action: "quiz.toggle_featured",
        entityType: "QUIZ",
        entityId: updated.id,
        metadata: {
          isFeatured: updated.isFeatured,
        },
      });

      return updated;
    }),

  createQuestion: adminProcedure
    .input(createQuizQuestionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const quiz = await ctx.db.quiz.findUnique({
        where: { id: input.quizId },
        select: { id: true },
      });

      if (!quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quiz not found.",
        });
      }

      const position = await getNextQuestionPosition(ctx.db, input.quizId);

      const question = await ctx.db.quizQuestion.create({
        data: {
          quizId: input.quizId,
          questionText: input.questionText.trim(),
          position,
          questionType: input.questionType,
          allowMultipleSelections:
            input.questionType === QUIZ_QUESTION_TYPE.MULTIPLE_CHOICE,
          explanation: normalizeOptionalText(input.explanation),
          points: input.points,
        },
        include: {
          options: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "quiz.question.create",
        entityType: "QUIZ_QUESTION",
        entityId: question.id,
        metadata: {
          quizId: input.quizId,
          points: question.points,
        },
      });

      return question;
    }),

  updateQuestion: adminProcedure
    .input(updateQuizQuestionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const question = await ctx.db.quizQuestion.update({
        where: { id: input.id },
        data: {
          quizId: input.quizId,
          questionText: input.questionText.trim(),
          questionType: input.questionType,
          allowMultipleSelections:
            input.questionType === QUIZ_QUESTION_TYPE.MULTIPLE_CHOICE,
          explanation: normalizeOptionalText(input.explanation),
          points: input.points,
        },
        include: {
          options: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "quiz.question.update",
        entityType: "QUIZ_QUESTION",
        entityId: question.id,
        metadata: {
          quizId: input.quizId,
          points: question.points,
        },
      });

      return question;
    }),

  deleteQuestion: adminProcedure
    .input(deleteQuizQuestionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.quizQuestion.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          quizId: true,
        },
      });

      await ctx.db.quizQuestion.delete({
        where: { id: input.id },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "quiz.question.delete",
        entityType: "QUIZ_QUESTION",
        entityId: input.id,
        metadata: {
          quizId: existing?.quizId ?? null,
        },
      });

      return { id: input.id };
    }),

  reorderQuestions: adminProcedure
    .input(reorderQuizQuestionsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const uniqueIds = Array.from(new Set(input.questionIds));
      if (uniqueIds.length !== input.questionIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Question reorder payload contains duplicates.",
        });
      }

      const existing = await ctx.db.quizQuestion.findMany({
        where: {
          quizId: input.quizId,
          id: {
            in: input.questionIds,
          },
        },
        select: {
          id: true,
        },
      });

      if (existing.length !== input.questionIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more questions are invalid for this quiz.",
        });
      }

      await ctx.db.$transaction(
        input.questionIds.map((questionId, index) =>
          ctx.db.quizQuestion.update({
            where: { id: questionId },
            data: { position: (index + 1) * 10 },
          }),
        ),
      );

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "quiz.question.reorder",
        entityType: "QUIZ",
        entityId: input.quizId,
        metadata: {
          questionIds: input.questionIds,
        },
      });

      return { success: true };
    }),

  createOption: adminProcedure.input(createQuizOptionInputSchema).mutation(async ({ ctx, input }) => {
    const question = await ctx.db.quizQuestion.findUnique({
      where: { id: input.questionId },
      select: {
        id: true,
        questionType: true,
      },
    });

    if (!question) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Question not found.",
      });
    }

    if (input.isCorrect && question.questionType === QUIZ_QUESTION_TYPE.SINGLE_CHOICE) {
      await ctx.db.quizOption.updateMany({
        where: {
          questionId: input.questionId,
          isCorrect: true,
        },
        data: {
          isCorrect: false,
        },
      });
    }

    const position = await getNextOptionPosition(ctx.db, input.questionId);

    const option = await ctx.db.quizOption.create({
      data: {
        questionId: input.questionId,
        optionText: input.optionText.trim(),
        isCorrect: input.isCorrect,
        position,
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "quiz.option.create",
      entityType: "QUIZ_OPTION",
      entityId: option.id,
      metadata: {
        questionId: input.questionId,
        isCorrect: option.isCorrect,
      },
    });

    return option;
  }),

  updateOption: adminProcedure.input(updateQuizOptionInputSchema).mutation(async ({ ctx, input }) => {
    const option = await ctx.db.quizOption.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        questionId: true,
        question: {
          select: {
            questionType: true,
          },
        },
      },
    });

    if (!option) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Option not found.",
      });
    }

    if (option.question.questionType === QUIZ_QUESTION_TYPE.SINGLE_CHOICE && input.isCorrect) {
      await ctx.db.quizOption.updateMany({
        where: {
          questionId: option.questionId,
          isCorrect: true,
          id: {
            not: option.id,
          },
        },
        data: {
          isCorrect: false,
        },
      });
    }

    const updated = await ctx.db.quizOption.update({
      where: {
        id: input.id,
      },
      data: {
        questionId: input.questionId,
        optionText: input.optionText.trim(),
        isCorrect: input.isCorrect,
      },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "quiz.option.update",
      entityType: "QUIZ_OPTION",
      entityId: updated.id,
      metadata: {
        questionId: updated.questionId,
        isCorrect: updated.isCorrect,
      },
    });

    return updated;
  }),

  deleteOption: adminProcedure.input(deleteQuizOptionInputSchema).mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.quizOption.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        questionId: true,
      },
    });

    await ctx.db.quizOption.delete({
      where: { id: input.id },
    });

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "quiz.option.delete",
      entityType: "QUIZ_OPTION",
      entityId: input.id,
      metadata: {
        questionId: existing?.questionId ?? null,
      },
    });

    return { id: input.id };
  }),

  reorderOptions: adminProcedure.input(reorderQuizOptionsInputSchema).mutation(async ({ ctx, input }) => {
    const uniqueIds = Array.from(new Set(input.optionIds));
    if (uniqueIds.length !== input.optionIds.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Option reorder payload contains duplicates.",
      });
    }

    const existing = await ctx.db.quizOption.findMany({
      where: {
        questionId: input.questionId,
        id: {
          in: input.optionIds,
        },
      },
      select: { id: true },
    });

    if (existing.length !== input.optionIds.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "One or more options are invalid for this question.",
      });
    }

    await ctx.db.$transaction(
      input.optionIds.map((optionId, index) =>
        ctx.db.quizOption.update({
          where: { id: optionId },
          data: { position: (index + 1) * 10 },
        }),
      ),
    );

    await createAuditLog({
      db: ctx.db,
      adminUserId: ctx.adminUser.id,
      action: "quiz.option.reorder",
      entityType: "QUIZ_QUESTION",
      entityId: input.questionId,
      metadata: {
        optionIds: input.optionIds,
      },
    });

    return { success: true };
  }),

  listAttempts: adminProcedure.input(listQuizAttemptsInputSchema).query(async ({ ctx, input }) => {
    const attempts = await ctx.db.quizAttempt.findMany({
      where: input.quizId ? { quizId: input.quizId } : undefined,
      orderBy: [{ submittedAt: "desc" }, { startedAt: "desc" }],
      take: input.limit,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    return {
      items: attempts,
    };
  }),

  analytics: adminProcedure.input(quizAnalyticsInputSchema).query(async ({ ctx, input }) => {
    const quiz = await ctx.db.quiz.findUnique({
      where: { id: input.quizId },
      select: {
        id: true,
        title: true,
        slug: true,
        passingScore: true,
      },
    });

    if (!quiz) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Quiz not found.",
      });
    }

    const attempts = await ctx.db.quizAttempt.findMany({
      where: {
        quizId: input.quizId,
        submittedAt: {
          not: null,
        },
      },
      orderBy: [{ submittedAt: "desc" }],
      select: {
        id: true,
        score: true,
        totalPoints: true,
        passed: true,
        submittedAt: true,
        guestName: true,
        guestEmail: true,
      },
    });

    const submittedAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0);
    const averageScore = submittedAttempts > 0 ? totalScore / submittedAttempts : 0;
    const passedCount = attempts.filter((attempt) => attempt.passed === true).length;

    const averagePercent =
      submittedAttempts > 0
        ? attempts.reduce((sum, attempt) => {
            if (!attempt.totalPoints || attempt.totalPoints <= 0) {
              return sum;
            }
            return sum + ((attempt.score ?? 0) / attempt.totalPoints) * 100;
          }, 0) / submittedAttempts
        : 0;

    return {
      quiz,
      summary: {
        submittedAttempts,
        averageScore,
        averagePercent,
        passedCount,
        failedCount: submittedAttempts - passedCount,
      },
      recentAttempts: attempts.slice(0, 12),
    };
  }),

  listLinkTargets: adminProcedure.query(async ({ ctx }) => {
    const [contentsResult, coursesResult, lessonsResult] = await Promise.allSettled([
      ctx.db.content.findMany({
        orderBy: [{ updatedAt: "desc" }],
        take: 120,
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          publishStatus: true,
        },
      }),
      ctx.db.course.findMany({
        orderBy: [{ updatedAt: "desc" }],
        take: 120,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      }),
      ctx.db.courseLesson.findMany({
        orderBy: [{ updatedAt: "desc" }],
        take: 160,
        select: {
          id: true,
          title: true,
          publishedAt: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
            },
          },
        },
      }),
    ]);

    if (contentsResult.status === "rejected") {
      throw contentsResult.reason;
    }

    const courses =
      coursesResult.status === "fulfilled"
        ? coursesResult.value
        : isMissingTableError(coursesResult.reason, ["Course"])
          ? []
          : (() => {
              throw coursesResult.reason;
            })();

    const lessons =
      lessonsResult.status === "fulfilled"
        ? lessonsResult.value
        : isMissingTableError(lessonsResult.reason, ["CourseLesson", "Course"])
          ? []
          : (() => {
              throw lessonsResult.reason;
            })();

    const contents = contentsResult.value;

    return {
      contents,
      courses,
      lessons,
    };
  }),

  listPublished: publicProcedure
    .input(listPublishedQuizzesInputSchema)
    .query(async ({ ctx, input }) => {
      if (!(await hasQuizReadSchema(ctx.db))) {
        return [];
      }

      try {
        return ctx.db.quiz.findMany({
          where: {
            status: QUIZ_STATUS.PUBLISHED,
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
                      description: {
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
              select: quizCoverSelect,
            },
            _count: {
              select: {
                questions: true,
                attempts: true,
              },
            },
          },
        });
      } catch (error) {
        if (isQuizIncludeFallbackError(error)) {
          try {
            const fallback = await ctx.db.quiz.findMany({
              where: {
                status: QUIZ_STATUS.PUBLISHED,
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
                          description: {
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
                _count: {
                  select: {
                    questions: true,
                    attempts: true,
                  },
                },
              },
            });
            return fallback.map((quiz) => ({
              ...quiz,
              coverImage: null,
            }));
          } catch (fallbackError) {
            if (isMissingQuizSchemaError(fallbackError)) {
              return [];
            }
            throw fallbackError;
          }
        }

        if (isMissingQuizSchemaError(error)) {
          return [];
        }
        throw error;
      }
    }),

  getPublishedBySlug: publicProcedure
    .input(quizBySlugInputSchema)
    .query(async ({ ctx, input }) => {
      if (!(await hasQuizReadSchema(ctx.db))) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quiz not found.",
        });
      }

      const quiz = await (async () => {
        try {
          return await ctx.db.quiz.findFirst({
            where: {
              slug: input.slug,
              status: {
                in: [QUIZ_STATUS.PUBLISHED, QUIZ_STATUS.CLOSED],
              },
            },
            include: {
              coverImage: {
                select: quizCoverSelect,
              },
              questions: {
                orderBy: { position: "asc" },
                include: {
                  options: {
                    orderBy: { position: "asc" },
                    select: {
                      id: true,
                      optionText: true,
                      position: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  questions: true,
                  attempts: true,
                },
              },
            },
          });
        } catch (error) {
          if (isQuizIncludeFallbackError(error)) {
            try {
              const fallbackQuiz = await ctx.db.quiz.findFirst({
                where: {
                  slug: input.slug,
                  status: {
                    in: [QUIZ_STATUS.PUBLISHED, QUIZ_STATUS.CLOSED],
                  },
                },
                include: {
                  questions: {
                    orderBy: { position: "asc" },
                    include: {
                      options: {
                        orderBy: { position: "asc" },
                        select: {
                          id: true,
                          optionText: true,
                          position: true,
                        },
                      },
                    },
                  },
                  _count: {
                    select: {
                      questions: true,
                      attempts: true,
                    },
                  },
                },
              });

              if (!fallbackQuiz) {
                return null;
              }

              return {
                ...fallbackQuiz,
                coverImage: null,
              };
            } catch (fallbackError) {
              if (isMissingQuizSchemaError(fallbackError)) {
                return null;
              }
              throw fallbackError;
            }
          }

          if (isMissingQuizSchemaError(error)) {
            return null;
          }
          throw error;
        }
      })();

      if (!quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quiz not found.",
        });
      }

      return {
        ...quiz,
        canAttempt: quiz.status === QUIZ_STATUS.PUBLISHED,
      };
    }),

  startAttempt: publicProcedure.input(startQuizAttemptInputSchema).mutation(async ({ ctx, input }) => {
    const quiz = await ctx.db.quiz.findUnique({
      where: { id: input.quizId },
      select: {
        id: true,
        status: true,
        allowMultipleAttempts: true,
      },
    });

    if (!quiz || quiz.status !== QUIZ_STATUS.PUBLISHED) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Published quiz not found.",
      });
    }

    const visitorTokenHash = await getVisitorTokenHash();

    if (!quiz.allowMultipleAttempts) {
      const existingSubmitted = await ctx.db.quizAttempt.findFirst({
        where: {
          quizId: input.quizId,
          visitorTokenHash,
          submittedAt: {
            not: null,
          },
        },
        select: { id: true },
      });

      if (existingSubmitted) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This quiz allows only one attempt per visitor.",
        });
      }
    }

    const attempt = await ctx.db.quizAttempt.create({
      data: {
        quizId: input.quizId,
        guestName: normalizeOptionalText(input.guestName),
        guestEmail: normalizeOptionalText(input.guestEmail),
        visitorTokenHash,
      },
      select: {
        id: true,
        startedAt: true,
      },
    });

    return attempt;
  }),

  submitAttempt: publicProcedure
    .input(submitQuizAttemptInputSchema)
    .mutation(async ({ ctx, input }) => {
      const visitorTokenHash = await getVisitorTokenHash();

      const attempt = await ctx.db.quizAttempt.findUnique({
        where: { id: input.attemptId },
        include: {
          quiz: {
            include: {
              questions: {
                orderBy: { position: "asc" },
                include: {
                  options: {
                    orderBy: { position: "asc" },
                  },
                },
              },
            },
          },
        },
      });

      if (!attempt || !attempt.quiz) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quiz attempt was not found.",
        });
      }

      if (attempt.visitorTokenHash !== visitorTokenHash) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This attempt does not belong to the current visitor.",
        });
      }

      if (attempt.submittedAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This attempt has already been submitted.",
        });
      }

      if (attempt.quiz.status !== QUIZ_STATUS.PUBLISHED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This quiz is no longer accepting submissions.",
        });
      }

      const now = new Date();
      const timeSpentSeconds = Math.max(
        0,
        Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000),
      );
      const totalPoints = attempt.quiz.questions.reduce(
        (sum, question) => sum + question.points,
        0,
      );
      const timeLimitExceeded =
        Boolean(attempt.quiz.timeLimitMinutes) &&
        timeSpentSeconds > (attempt.quiz.timeLimitMinutes as number) * 60;

      if (timeLimitExceeded) {
        const result = await ctx.db.quizAttempt.update({
          where: { id: attempt.id },
          data: {
            submittedAt: now,
            score: 0,
            totalPoints,
            passed: attempt.quiz.passingScore !== null ? false : null,
            timeSpentSeconds,
          },
          select: {
            id: true,
            score: true,
            totalPoints: true,
            passed: true,
            submittedAt: true,
          },
        });

        return {
          attemptId: result.id,
          score: result.score ?? 0,
          totalPoints: result.totalPoints ?? totalPoints,
          percentage:
            totalPoints > 0
              ? Math.round(((result.score ?? 0) / totalPoints) * 100)
              : 0,
          passed: result.passed,
          submittedAt: result.submittedAt,
          showAnswers: false,
          timedOut: true,
          questionResults: [],
        };
      }

      const answersByQuestion = new Map<string, Set<string>>();
      for (const entry of input.answers) {
        if (answersByQuestion.has(entry.questionId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Duplicate answers for the same question are not allowed.",
          });
        }
        answersByQuestion.set(entry.questionId, new Set(entry.optionIds));
      }

      const answerRecords: Array<{
        attemptId: string;
        questionId: string;
        optionId: string;
      }> = [];

      const questionResults = attempt.quiz.questions.map((question) => {
        const selectedSet = answersByQuestion.get(question.id) ?? new Set<string>();
        const optionIdSet = new Set(question.options.map((option) => option.id));

        for (const optionId of selectedSet) {
          if (!optionIdSet.has(optionId)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "One or more selected options are invalid for a question.",
            });
          }

          answerRecords.push({
            attemptId: attempt.id,
            questionId: question.id,
            optionId,
          });
        }

        const correctOptionIds = question.options
          .filter((option) => option.isCorrect)
          .map((option) => option.id)
          .sort();
        const selectedOptionIds = Array.from(selectedSet).sort();

        const isCorrect =
          correctOptionIds.length > 0 &&
          selectedOptionIds.length === correctOptionIds.length &&
          selectedOptionIds.every(
            (optionId, index) => optionId === correctOptionIds[index],
          );

        const earnedPoints = isCorrect ? question.points : 0;

        return {
          questionId: question.id,
          questionText: question.questionText,
          points: question.points,
          earnedPoints,
          selectedOptionIds,
          correctOptionIds,
          explanation: question.explanation,
          options: question.options.map((option) => ({
            id: option.id,
            text: option.optionText,
          })),
        };
      });

      const score = questionResults.reduce(
        (sum, question) => sum + question.earnedPoints,
        0,
      );
      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
      const passed =
        attempt.quiz.passingScore !== null ? percentage >= attempt.quiz.passingScore : null;

      await ctx.db.$transaction(async (tx) => {
        if (answerRecords.length > 0) {
          await tx.quizAnswer.createMany({
            data: answerRecords,
            skipDuplicates: true,
          });
        }

        await tx.quizAttempt.update({
          where: { id: attempt.id },
          data: {
            submittedAt: now,
            score,
            totalPoints,
            passed,
            timeSpentSeconds,
          },
        });
      });

      return {
        attemptId: attempt.id,
        score,
        totalPoints,
        percentage,
        passed,
        submittedAt: now,
        showAnswers: attempt.quiz.showAnswersAfterSubmit,
        timedOut: false,
        questionResults: attempt.quiz.showAnswersAfterSubmit
          ? questionResults
          : [],
      };
    }),
});
