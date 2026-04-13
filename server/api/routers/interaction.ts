import { Prisma, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  COMMENT_STATUS,
  COURSE_STATUS,
  INTERACTION_TARGET_TYPE,
  type InteractionTargetType,
} from "@/lib/content/enums";
import { getContentPublicPath } from "@/lib/interaction/constants";
import {
  adminListCommentsInputSchema,
  createCommentInputSchema,
  deleteCommentInputSchema,
  getLikeSummaryInputSchema,
  listVisibleCommentsInputSchema,
  normalizeCommentBody,
  normalizeOptionalText,
  toggleLikeInputSchema,
  updateCommentStatusInputSchema,
} from "@/lib/interaction/schemas";
import { getVisitorTokenHash } from "@/lib/interaction/visitor";
import { createTRPCRouter, adminProcedure, publicProcedure } from "@/server/api/trpc";
import { createAuditLog } from "@/server/audit/log";

type InteractionTargetInput = {
  targetType: InteractionTargetType;
  targetId: string;
};

function isLegacyInteractionSchemaError(error: unknown) {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : String(error ?? "");
  const lowerMessage = message.toLowerCase();
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (lowerMessage.includes('invalid input value for enum "commentstatus"')) {
    return true;
  }
  if (
    lowerMessage.includes("does not exist in the current database") ||
    lowerMessage.includes("the column `(not available)` does not exist") ||
    (lowerMessage.includes("column") && lowerMessage.includes("does not exist"))
  ) {
    return true;
  }
  if (code === "P2021" || code === "P2022" || code === "P2010") {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      const text = String(error.message);
      return (
        text.includes("Comment") ||
        text.includes("ContentLike") ||
        text.includes("InteractionTargetType") ||
        text.includes("targetType") ||
        text.includes("SiteSetting") ||
        text.includes("Course") ||
        text.includes("Content")
      );
    }

    if (error.code === "P2022") {
      return true;
    }

    if (error.code === "P2010") {
      const text = String(error.message);
      return (
        text.includes("Comment") ||
        text.includes("ContentLike") ||
        text.includes("InteractionTargetType") ||
        text.includes("targetType") ||
        text.includes("CommentStatus") ||
        text.includes("commentStatus") ||
        text.includes("SiteSetting") ||
        text.includes("Course") ||
        text.includes("Content")
      );
    }
  }

  return false;
}

function toPreconditionError(error: unknown) {
  if (!isLegacyInteractionSchemaError(error)) {
    return null;
  }

  return new TRPCError({
    code: "PRECONDITION_FAILED",
    message:
      "Interaction tables are missing. Run Prisma migration before using guest comments and likes.",
  });
}

function getTargetWhere(input: InteractionTargetInput) {
  if (input.targetType === INTERACTION_TARGET_TYPE.CONTENT) {
    return {
      targetType: INTERACTION_TARGET_TYPE.CONTENT,
      contentId: input.targetId,
    };
  }

  if (input.targetType === INTERACTION_TARGET_TYPE.COURSE) {
    return {
      targetType: INTERACTION_TARGET_TYPE.COURSE,
      courseId: input.targetId,
    };
  }

  return {
    targetType: INTERACTION_TARGET_TYPE.COURSE_LESSON,
    courseLessonId: input.targetId,
  };
}

function getTargetRelationData(input: InteractionTargetInput) {
  return {
    targetType: input.targetType,
    contentId: input.targetType === INTERACTION_TARGET_TYPE.CONTENT ? input.targetId : null,
    courseId: input.targetType === INTERACTION_TARGET_TYPE.COURSE ? input.targetId : null,
    courseLessonId:
      input.targetType === INTERACTION_TARGET_TYPE.COURSE_LESSON ? input.targetId : null,
  };
}

async function assertPublishedTargetExists(args: {
  db: PrismaClient;
  input: InteractionTargetInput;
}) {
  if (args.input.targetType === INTERACTION_TARGET_TYPE.CONTENT) {
    const content = await args.db.content.findFirst({
      where: {
        id: args.input.targetId,
        publishStatus: "PUBLISHED",
      },
      select: {
        id: true,
      },
    });

    if (!content) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Target content was not found.",
      });
    }
    return;
  }

  if (args.input.targetType === INTERACTION_TARGET_TYPE.COURSE) {
    const course = await args.db.course.findFirst({
      where: {
        id: args.input.targetId,
        status: COURSE_STATUS.PUBLISHED,
      },
      select: {
        id: true,
      },
    });

    if (!course) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Target course was not found.",
      });
    }
    return;
  }

  const lesson = await args.db.courseLesson.findFirst({
    where: {
      id: args.input.targetId,
      publishedAt: {
        not: null,
      },
      course: {
        status: COURSE_STATUS.PUBLISHED,
      },
    },
    select: {
      id: true,
    },
  });

  if (!lesson) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Target lesson was not found.",
    });
  }
}

function getTargetIdFromRow(row: {
  targetType: InteractionTargetType;
  contentId: string | null;
  courseId: string | null;
  courseLessonId: string | null;
}) {
  if (row.targetType === INTERACTION_TARGET_TYPE.CONTENT) {
    return row.contentId;
  }

  if (row.targetType === INTERACTION_TARGET_TYPE.COURSE) {
    return row.courseId;
  }

  return row.courseLessonId;
}

async function getCommentModerationEnabled(db: PrismaClient) {
  try {
    const setting = await db.siteSetting.findUnique({
      where: {
        singletonKey: "SITE_SETTINGS",
      },
      select: {
        commentModerationEnabled: true,
      },
    });

    return setting?.commentModerationEnabled ?? true;
  } catch (error) {
    if (isLegacyInteractionSchemaError(error)) {
      return true;
    }
    throw error;
  }
}

async function hasPendingCommentStatus(db: PrismaClient) {
  try {
    const rows = await db.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'CommentStatus'
          AND e.enumlabel = 'PENDING'
      ) AS "exists"
    `;

    return rows[0]?.exists ?? false;
  } catch {
    return false;
  }
}

function mapCommentTarget(comment: {
  targetType: InteractionTargetType;
  content: { id: string; title: string; slug: string; type: "JOURNAL" | "ARTICLE" | "PROJECT" } | null;
  course: { id: string; title: string; slug: string } | null;
  courseLesson: { id: string; title: string; course: { slug: string; title: string } } | null;
}) {
  if (comment.targetType === INTERACTION_TARGET_TYPE.CONTENT && comment.content) {
    return {
      id: comment.content.id,
      title: comment.content.title,
      href: getContentPublicPath(comment.content.type, comment.content.slug),
      slug: comment.content.slug,
      type: INTERACTION_TARGET_TYPE.CONTENT,
    };
  }

  if (comment.targetType === INTERACTION_TARGET_TYPE.COURSE && comment.course) {
    return {
      id: comment.course.id,
      title: comment.course.title,
      href: `/courses/${comment.course.slug}`,
      slug: comment.course.slug,
      type: INTERACTION_TARGET_TYPE.COURSE,
    };
  }

  if (comment.targetType === INTERACTION_TARGET_TYPE.COURSE_LESSON && comment.courseLesson) {
    return {
      id: comment.courseLesson.id,
      title: comment.courseLesson.title,
      href: `/courses/${comment.courseLesson.course.slug}#lesson-${comment.courseLesson.id}`,
      slug: comment.courseLesson.course.slug,
      type: INTERACTION_TARGET_TYPE.COURSE_LESSON,
    };
  }

  return {
    id: "unknown",
    title: "Unavailable target",
    href: "/",
    slug: null as string | null,
    type: comment.targetType,
  };
}

export const interactionRouter = createTRPCRouter({
  listVisibleComments: publicProcedure
    .input(listVisibleCommentsInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        await assertPublishedTargetExists({ db: ctx.db, input });

        const where = {
          ...getTargetWhere(input),
          status: COMMENT_STATUS.VISIBLE,
        };

        const [items, totalVisible] = await Promise.all([
          ctx.db.comment.findMany({
            where,
            orderBy: [{ createdAt: "desc" }],
            take: input.limit,
            select: {
              id: true,
              guestName: true,
              guestWebsite: true,
              body: true,
              createdAt: true,
            },
          }),
          ctx.db.comment.count({
            where,
          }),
        ]);

        return {
          items,
          totalVisible,
        };
      } catch (error) {
        if (isLegacyInteractionSchemaError(error)) {
          return {
            items: [],
            totalVisible: 0,
          };
        }

        throw error;
      }
    }),

  createComment: publicProcedure
    .input(createCommentInputSchema)
    .mutation(async ({ ctx, input }) => {
      if ((input.honeypot ?? "").trim().length > 0) {
        return {
          accepted: true,
          status: COMMENT_STATUS.PENDING,
        };
      }

      try {
        await assertPublishedTargetExists({ db: ctx.db, input });

        const visitorTokenHash = await getVisitorTokenHash();
        const now = new Date();
        const cooldownStart = new Date(now.getTime() - 20_000);

        const recentComment = await ctx.db.comment.findFirst({
          where: {
            guestFingerprintHash: visitorTokenHash,
            createdAt: {
              gte: cooldownStart,
            },
          },
          select: {
            id: true,
          },
        });

        if (recentComment) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Please wait a few seconds before posting another comment.",
          });
        }

        const moderationEnabled = await getCommentModerationEnabled(ctx.db);
        const pendingSupported = await hasPendingCommentStatus(ctx.db);
        const status =
          moderationEnabled && pendingSupported
            ? COMMENT_STATUS.PENDING
            : COMMENT_STATUS.VISIBLE;

        const created = await ctx.db.comment.create({
          data: {
            ...getTargetRelationData(input),
            guestName: input.guestName.trim(),
            guestEmail: normalizeOptionalText(input.guestEmail),
            guestWebsite: normalizeOptionalText(input.guestWebsite),
            guestFingerprintHash: visitorTokenHash,
            body: normalizeCommentBody(input.body),
            status,
          },
          select: {
            id: true,
            status: true,
          },
        });

        return {
          accepted: true,
          status: created.status,
          commentId: created.id,
        };
      } catch (error) {
        const preconditionError = toPreconditionError(error);
        if (preconditionError) {
          throw preconditionError;
        }

        throw error;
      }
    }),

  getLikeSummary: publicProcedure
    .input(getLikeSummaryInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        await assertPublishedTargetExists({ db: ctx.db, input });
        const visitorTokenHash = await getVisitorTokenHash();
        const where = getTargetWhere(input);

        const [likesCount, existingLike] = await Promise.all([
          ctx.db.contentLike.count({
            where,
          }),
          ctx.db.contentLike.findFirst({
            where: {
              ...where,
              visitorTokenHash,
            },
            select: {
              id: true,
            },
          }),
        ]);

        return {
          liked: Boolean(existingLike),
          likesCount,
        };
      } catch (error) {
        if (isLegacyInteractionSchemaError(error)) {
          return {
            liked: false,
            likesCount: 0,
          };
        }

        throw error;
      }
    }),

  toggleLike: publicProcedure.input(toggleLikeInputSchema).mutation(async ({ ctx, input }) => {
    try {
      await assertPublishedTargetExists({ db: ctx.db, input });
      const visitorTokenHash = await getVisitorTokenHash();
      const where = getTargetWhere(input);
      const existing = await ctx.db.contentLike.findFirst({
        where: {
          ...where,
          visitorTokenHash,
        },
        select: {
          id: true,
        },
      });

      let liked = false;
      if (existing) {
        await ctx.db.contentLike.delete({
          where: {
            id: existing.id,
          },
        });
      } else {
        try {
          await ctx.db.contentLike.create({
            data: {
              ...getTargetRelationData(input),
              visitorTokenHash,
            },
          });
          liked = true;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            liked = true;
          } else {
            throw error;
          }
        }
      }

      const likesCount = await ctx.db.contentLike.count({
        where,
      });

      return {
        liked,
        likesCount,
      };
    } catch (error) {
      const preconditionError = toPreconditionError(error);
      if (preconditionError) {
        throw preconditionError;
      }

      throw error;
    }
  }),

  listCommentsAdmin: adminProcedure
    .input(adminListCommentsInputSchema)
    .query(async ({ ctx, input }) => {
      try {
        const where = {
          ...(input.status ? { status: input.status } : {}),
          ...(input.targetType ? { targetType: input.targetType } : {}),
          ...(input.query
            ? {
                OR: [
                  {
                    guestName: {
                      contains: input.query,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    guestEmail: {
                      contains: input.query,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    body: {
                      contains: input.query,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              }
            : {}),
        };

        const [comments, total] = await Promise.all([
          ctx.db.comment.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: (input.page - 1) * input.pageSize,
            take: input.pageSize,
            include: {
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
                      slug: true,
                      title: true,
                    },
                  },
                },
              },
              moderatedByAdmin: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          }),
          ctx.db.comment.count({ where }),
        ]);

        return {
          items: comments.map((comment) => ({
            id: comment.id,
            status: comment.status,
            guestName: comment.guestName,
            guestEmail: comment.guestEmail,
            guestWebsite: comment.guestWebsite,
            body: comment.body,
            moderationNote: comment.moderationNote,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            targetType: comment.targetType,
            target: mapCommentTarget(comment),
            moderatedBy: comment.moderatedByAdmin
              ? {
                  id: comment.moderatedByAdmin.id,
                  name:
                    `${comment.moderatedByAdmin.firstName ?? ""} ${comment.moderatedByAdmin.lastName ?? ""}`.trim() ||
                    comment.moderatedByAdmin.email,
                }
              : null,
          })),
          total,
          page: input.page,
          pageSize: input.pageSize,
        };
      } catch (error) {
        const preconditionError = toPreconditionError(error);
        if (preconditionError) {
          throw preconditionError;
        }

        throw error;
      }
    }),

  updateCommentStatus: adminProcedure
    .input(updateCommentStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.status === COMMENT_STATUS.PENDING) {
          const pendingSupported = await hasPendingCommentStatus(ctx.db);
          if (!pendingSupported) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message:
                "Pending moderation status is unavailable until the latest database migration is applied.",
            });
          }
        }

        const updated = await ctx.db.comment.update({
          where: {
            id: input.commentId,
          },
          data: {
            status: input.status,
            moderationNote: normalizeOptionalText(input.moderationNote),
            moderatedByAdminId: ctx.adminUser.id,
          },
          select: {
            id: true,
            status: true,
          },
        });

        await createAuditLog({
          db: ctx.db,
          adminUserId: ctx.adminUser.id,
          action: "comment.moderate",
          entityType: "COMMENT",
          entityId: updated.id,
          metadata: {
            status: updated.status,
            moderationNote: normalizeOptionalText(input.moderationNote),
          },
        });

        return updated;
      } catch (error) {
        const preconditionError = toPreconditionError(error);
        if (preconditionError) {
          throw preconditionError;
        }

        throw error;
      }
    }),

  deleteComment: adminProcedure.input(deleteCommentInputSchema).mutation(async ({ ctx, input }) => {
    try {
      const existing = await ctx.db.comment.findUnique({
        where: {
          id: input.commentId,
        },
        select: {
          id: true,
          guestName: true,
          targetType: true,
        },
      });

      await ctx.db.comment.delete({
        where: {
          id: input.commentId,
        },
      });

      await createAuditLog({
        db: ctx.db,
        adminUserId: ctx.adminUser.id,
        action: "comment.delete",
        entityType: "COMMENT",
        entityId: input.commentId,
        metadata: {
          guestName: existing?.guestName ?? null,
          targetType: existing?.targetType ?? null,
        },
      });

      return {
        id: input.commentId,
      };
    } catch (error) {
      const preconditionError = toPreconditionError(error);
      if (preconditionError) {
        throw preconditionError;
      }

      throw error;
    }
  }),

  getAdminStats: adminProcedure.query(async ({ ctx }) => {
    const fallback = {
      counts: {
        visibleComments: 0,
        pendingComments: 0,
        hiddenComments: 0,
        deletedComments: 0,
        totalLikes: 0,
      },
      latestComments: [],
      topEngagedTargets: [],
    } as const;

    try {
      const pendingSupported = await hasPendingCommentStatus(ctx.db);
      const statusesForActivity = pendingSupported
        ? [COMMENT_STATUS.VISIBLE, COMMENT_STATUS.PENDING]
        : [COMMENT_STATUS.VISIBLE];

      const [visibleComments, pendingComments, hiddenComments, deletedComments, totalLikes] =
        await Promise.all([
          ctx.db.comment.count({ where: { status: COMMENT_STATUS.VISIBLE } }),
          pendingSupported
            ? ctx.db.comment.count({ where: { status: COMMENT_STATUS.PENDING } })
            : Promise.resolve(0),
          ctx.db.comment.count({ where: { status: COMMENT_STATUS.HIDDEN } }),
          ctx.db.comment.count({ where: { status: COMMENT_STATUS.DELETED } }),
          ctx.db.contentLike.count(),
        ]);

      const latestComments = await ctx.db.comment.findMany({
        where: {
          status: {
            in: statusesForActivity,
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 6,
        include: {
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
                  slug: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      const [commentGroups, likeGroups] = await Promise.all([
        ctx.db.comment.groupBy({
          by: ["targetType", "contentId", "courseId", "courseLessonId"],
          where: {
            status: COMMENT_STATUS.VISIBLE,
          },
          _count: {
            _all: true,
          },
        }),
        ctx.db.contentLike.groupBy({
          by: ["targetType", "contentId", "courseId", "courseLessonId"],
          _count: {
            _all: true,
          },
        }),
      ]);

      const aggregateByTarget = new Map<
        string,
        {
          targetType: InteractionTargetType;
          targetId: string;
          commentsCount: number;
          likesCount: number;
        }
      >();

      for (const row of commentGroups) {
        const targetId = getTargetIdFromRow(row);
        if (!targetId) continue;
        const key = `${row.targetType}:${targetId}`;
        const existing = aggregateByTarget.get(key);

        if (existing) {
          existing.commentsCount += row._count._all;
        } else {
          aggregateByTarget.set(key, {
            targetType: row.targetType,
            targetId,
            commentsCount: row._count._all,
            likesCount: 0,
          });
        }
      }

      for (const row of likeGroups) {
        const targetId = getTargetIdFromRow(row);
        if (!targetId) continue;
        const key = `${row.targetType}:${targetId}`;
        const existing = aggregateByTarget.get(key);

        if (existing) {
          existing.likesCount += row._count._all;
        } else {
          aggregateByTarget.set(key, {
            targetType: row.targetType,
            targetId,
            commentsCount: 0,
            likesCount: row._count._all,
          });
        }
      }

      const topCandidates = Array.from(aggregateByTarget.values())
        .map((entry) => ({
          ...entry,
          engagementScore: entry.commentsCount * 2 + entry.likesCount,
        }))
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 8);

      const contentIds = topCandidates
        .filter((entry) => entry.targetType === INTERACTION_TARGET_TYPE.CONTENT)
        .map((entry) => entry.targetId);
      const courseIds = topCandidates
        .filter((entry) => entry.targetType === INTERACTION_TARGET_TYPE.COURSE)
        .map((entry) => entry.targetId);
      const lessonIds = topCandidates
        .filter((entry) => entry.targetType === INTERACTION_TARGET_TYPE.COURSE_LESSON)
        .map((entry) => entry.targetId);

      const [contentTargets, courseTargets, lessonTargets] = await Promise.all([
        contentIds.length
          ? ctx.db.content.findMany({
              where: {
                id: {
                  in: contentIds,
                },
              },
              select: {
                id: true,
                title: true,
                slug: true,
                type: true,
              },
            })
          : Promise.resolve([]),
        courseIds.length
          ? ctx.db.course.findMany({
              where: {
                id: {
                  in: courseIds,
                },
              },
              select: {
                id: true,
                title: true,
                slug: true,
              },
            })
          : Promise.resolve([]),
        lessonIds.length
          ? ctx.db.courseLesson.findMany({
              where: {
                id: {
                  in: lessonIds,
                },
              },
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    slug: true,
                  },
                },
              },
            })
          : Promise.resolve([]),
      ]);

      const contentMap = new Map(contentTargets.map((target) => [target.id, target]));
      const courseMap = new Map(courseTargets.map((target) => [target.id, target]));
      const lessonMap = new Map(lessonTargets.map((target) => [target.id, target]));

      const mappedTopEngagedTargets = topCandidates
        .map((entry) => {
          if (entry.targetType === INTERACTION_TARGET_TYPE.CONTENT) {
            const target = contentMap.get(entry.targetId);
            if (!target) return null;
            return {
              ...entry,
              title: target.title,
              href: getContentPublicPath(target.type, target.slug),
            };
          }

          if (entry.targetType === INTERACTION_TARGET_TYPE.COURSE) {
            const target = courseMap.get(entry.targetId);
            if (!target) return null;
            return {
              ...entry,
              title: target.title,
              href: `/courses/${target.slug}`,
            };
          }

          const target = lessonMap.get(entry.targetId);
          if (!target) return null;
          return {
            ...entry,
            title: target.title,
            href: `/courses/${target.course.slug}#lesson-${target.id}`,
          };
        });

      const topEngagedTargets = mappedTopEngagedTargets
        .filter(
          (
            target,
          ): target is NonNullable<(typeof mappedTopEngagedTargets)[number]> =>
            target !== null,
        )
        .slice(0, 5);

      return {
        counts: {
          visibleComments,
          pendingComments,
          hiddenComments,
          deletedComments,
          totalLikes,
        },
        latestComments: latestComments.map((comment) => ({
          id: comment.id,
          guestName: comment.guestName,
          body: comment.body,
          createdAt: comment.createdAt,
          status: comment.status,
          target: mapCommentTarget(comment),
        })),
        topEngagedTargets,
      };
    } catch (error) {
      if (isLegacyInteractionSchemaError(error)) {
        return fallback;
      }
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : String(error ?? "");
      const lowerMessage = message.toLowerCase();
      if (
        lowerMessage.includes("invalid `ctx.db.comment.findmany()` invocation") ||
        lowerMessage.includes("does not exist in the current database") ||
        lowerMessage.includes("the column `(not available)` does not exist")
      ) {
        return fallback;
      }

      throw error;
    }
  }),
});
