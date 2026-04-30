import { vi } from "vitest";

export type PrismaMock = ReturnType<typeof createPrismaMock>;

export function createPrismaMock() {
  const db = {
    $transaction: vi.fn(async (value: unknown) => {
      if (typeof value === "function") {
        return (value as (tx: unknown) => unknown)(db);
      }

      if (Array.isArray(value)) {
        return Promise.all(value as Promise<unknown>[]);
      }

      return value;
    }),
    $queryRaw: vi.fn(),
    content: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    contentTag: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    course: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    courseSection: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    courseLesson: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    mediaAsset: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    quiz: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    quizQuestion: {
      findFirst: vi.fn(),
    },
    quizOption: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    quizAttempt: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    quizAnswer: {
      createMany: vi.fn(),
    },
    comment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    contentLike: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    siteSetting: {
      findUnique: vi.fn(),
    },
    adminUser: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    adminProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  };

  return db;
}
