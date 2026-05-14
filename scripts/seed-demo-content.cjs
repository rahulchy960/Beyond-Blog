/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaNeon } = require("@prisma/adapter-neon");
const { neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL in environment.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const now = new Date();

function articleHtml(title, body) {
  return `
    <h2>${title}</h2>
    <p>${body}</p>
    <h3>Key Points</h3>
    <ul>
      <li>Production-oriented implementation</li>
      <li>Clear architecture and typing</li>
      <li>Performance and maintainability first</li>
    </ul>
  `.trim();
}

async function ensureTag(name, slug) {
  return prisma.tag.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
}

async function ensureCategory(name, slug, description) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, description, isActive: true },
    create: { name, slug, description, isActive: true },
  });
}

async function setContentTags(contentId, tagSlugs) {
  const tags = await prisma.tag.findMany({
    where: { slug: { in: tagSlugs } },
    select: { id: true },
  });

  await prisma.contentTag.deleteMany({ where: { contentId } });

  if (tags.length > 0) {
    await prisma.contentTag.createMany({
      data: tags.map((tag) => ({
        contentId,
        tagId: tag.id,
      })),
      skipDuplicates: true,
    });
  }
}

async function upsertContent(input) {
  const content = await prisma.content.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      summary: input.summary,
      bodyHtml: input.bodyHtml,
      bodyJson: input.bodyJson,
      type: input.type,
      publishStatus: "PUBLISHED",
      isFeatured: input.isFeatured ?? false,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: now,
      authorId: input.authorId,
      categoryId: input.categoryId ?? null,
    },
    create: {
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      bodyHtml: input.bodyHtml,
      bodyJson: input.bodyJson,
      type: input.type,
      publishStatus: "PUBLISHED",
      isFeatured: input.isFeatured ?? false,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: now,
      authorId: input.authorId,
      categoryId: input.categoryId ?? null,
    },
  });

  await setContentTags(content.id, input.tagSlugs ?? []);
  return content;
}

async function seedCourse(input) {
  const course = await prisma.course.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      summary: input.summary,
      descriptionHtml: input.descriptionHtml,
      descriptionJson: null,
      status: "PUBLISHED",
      isFeatured: input.isFeatured ?? false,
      difficultyLevel: input.difficultyLevel ?? null,
      estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: now,
      createdByAdminId: input.adminId,
      authorId: input.authorId,
    },
    create: {
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      descriptionHtml: input.descriptionHtml,
      descriptionJson: null,
      status: "PUBLISHED",
      isFeatured: input.isFeatured ?? false,
      difficultyLevel: input.difficultyLevel ?? null,
      estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: now,
      createdByAdminId: input.adminId,
      authorId: input.authorId,
    },
  });

  await prisma.courseLesson.deleteMany({ where: { courseId: course.id } });
  await prisma.courseSection.deleteMany({ where: { courseId: course.id } });

  const sectionA = await prisma.courseSection.create({
    data: {
      courseId: course.id,
      title: "Foundations",
      description: "Core language and runtime fundamentals.",
      order: 1,
    },
  });

  const sectionB = await prisma.courseSection.create({
    data: {
      courseId: course.id,
      title: "Applied Patterns",
      description: "Practical architecture and delivery patterns.",
      order: 2,
    },
  });

  await prisma.courseLesson.createMany({
    data: [
      {
        courseId: course.id,
        sectionId: sectionA.id,
        title: "Runtime and Event Loop Basics",
        slug: `${input.slug}-runtime-basics`,
        summary: "Understand concurrency, queues, and async behavior.",
        order: 1,
        itemType: "RICH_TEXT",
        bodyHtml: articleHtml(
          "Runtime and Event Loop",
          "This lesson covers call stack flow, microtasks, and how async code executes in real systems.",
        ),
        isPreview: true,
        publishedAt: now,
      },
      {
        courseId: course.id,
        sectionId: sectionA.id,
        title: "Type-Safe APIs with Zod and tRPC",
        slug: `${input.slug}-typesafe-apis`,
        summary: "Build end-to-end typed contracts for frontend and backend.",
        order: 2,
        itemType: "RICH_TEXT",
        bodyHtml: articleHtml(
          "Type-Safe APIs",
          "Define validation schemas once and use them from mutation input to UI form feedback.",
        ),
        isPreview: false,
        publishedAt: now,
      },
      {
        courseId: course.id,
        sectionId: sectionB.id,
        title: "Deploying Production Apps on Vercel + Neon",
        slug: `${input.slug}-deployment`,
        summary: "Operational checklist for shipping stable web apps.",
        order: 1,
        itemType: "RICH_TEXT",
        bodyHtml: articleHtml(
          "Deployment Strategy",
          "Learn migration flow, environment hardening, and post-deploy validation steps.",
        ),
        isPreview: false,
        publishedAt: now,
      },
    ],
  });

  return course;
}

async function seedQuiz(input) {
  const quiz = await prisma.quiz.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      description: input.description,
      status: "PUBLISHED",
      isFeatured: input.isFeatured ?? false,
      showAnswersAfterSubmit: true,
      allowMultipleAttempts: true,
      timeLimitMinutes: input.timeLimitMinutes ?? null,
      passingScore: input.passingScore ?? null,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: now,
      createdByAdminId: input.adminId,
      authorId: input.authorId,
      contentId: input.contentId ?? null,
      courseId: input.courseId ?? null,
    },
    create: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      status: "PUBLISHED",
      isFeatured: input.isFeatured ?? false,
      showAnswersAfterSubmit: true,
      allowMultipleAttempts: true,
      timeLimitMinutes: input.timeLimitMinutes ?? null,
      passingScore: input.passingScore ?? null,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: now,
      createdByAdminId: input.adminId,
      authorId: input.authorId,
      contentId: input.contentId ?? null,
      courseId: input.courseId ?? null,
    },
  });

  await prisma.quizQuestion.deleteMany({ where: { quizId: quiz.id } });

  const q1 = await prisma.quizQuestion.create({
    data: {
      quizId: quiz.id,
      questionText: "Which pattern best separates data access from route handlers?",
      position: 1,
      points: 1,
      questionType: "SINGLE_CHOICE",
      explanation: "A service/repository style keeps handlers thin and testable.",
    },
  });

  const q2 = await prisma.quizQuestion.create({
    data: {
      quizId: quiz.id,
      questionText: "Which tools are commonly used for end-to-end type safety in this stack?",
      position: 2,
      points: 1,
      questionType: "MULTIPLE_CHOICE",
      allowMultipleSelections: true,
      explanation: "Zod handles validation and tRPC carries types to the client.",
    },
  });

  await prisma.quizOption.createMany({
    data: [
      { questionId: q1.id, optionText: "Repository/Service Layer", isCorrect: true, position: 1 },
      { questionId: q1.id, optionText: "Inline SQL in JSX", isCorrect: false, position: 2 },
      { questionId: q1.id, optionText: "Client-only State", isCorrect: false, position: 3 },

      { questionId: q2.id, optionText: "Zod", isCorrect: true, position: 1 },
      { questionId: q2.id, optionText: "tRPC", isCorrect: true, position: 2 },
      { questionId: q2.id, optionText: "jQuery", isCorrect: false, position: 3 },
      { questionId: q2.id, optionText: "Prisma", isCorrect: true, position: 4 },
    ],
  });

  return quiz;
}

async function main() {
  const owner = await prisma.adminUser.findFirst({
    where: { role: "OWNER" },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, clerkUserId: true },
  });

  if (!owner) {
    throw new Error("No OWNER admin found. Run `npm run db:seed` first.");
  }

  const ownerProfile = await prisma.adminProfile.findUnique({
    where: { adminUserId: owner.id },
    select: { id: true },
  });

  if (!ownerProfile) {
    throw new Error("No admin profile found for OWNER. Run `npm run db:seed` first.");
  }

  const webCategory = await ensureCategory(
    "Web Engineering",
    "web-engineering",
    "Architecture, frameworks, and delivery patterns for modern web systems.",
  );
  const systemsCategory = await ensureCategory(
    "Systems and Performance",
    "systems-performance",
    "Runtime behavior, optimization, and scalable backend execution.",
  );

  await Promise.all([
    ensureTag("TypeScript", "typescript"),
    ensureTag("Next.js", "nextjs"),
    ensureTag("React", "react"),
    ensureTag("Node.js", "nodejs"),
    ensureTag("Performance", "performance"),
    ensureTag("Architecture", "architecture"),
  ]);

  const contentEntries = await Promise.all([
    upsertContent({
    authorId: ownerProfile.id,
      type: "JOURNAL",
      title: "Engineering Notes: Designing Reliable API Boundaries",
      slug: "engineering-notes-api-boundaries",
      summary: "A journal entry about keeping route handlers thin with validated service contracts.",
      bodyHtml: articleHtml(
        "Reliable API Boundaries",
        "A practical note on separating transport concerns from business logic using schemas and typed contracts.",
      ),
      bodyJson: null,
      categoryId: webCategory.id,
      tagSlugs: ["typescript", "architecture", "nextjs"],
      seoTitle: "Engineering Notes on Reliable API Boundaries",
      seoDescription: "Journal note on schema-first API contracts in production web systems.",
      isFeatured: true,
    }),
    upsertContent({
    authorId: ownerProfile.id,
      type: "JOURNAL",
      title: "Field Log: Improving Runtime Stability in Production",
      slug: "field-log-runtime-stability",
      summary: "Observations from improving resilience and error boundaries in a live deployment.",
      bodyHtml: articleHtml(
        "Runtime Stability",
        "A short field log describing practical hardening for server routes, fallbacks, and observability.",
      ),
      bodyJson: null,
      categoryId: systemsCategory.id,
      tagSlugs: ["performance", "nodejs", "architecture"],
      seoTitle: "Field Log on Runtime Stability",
      seoDescription: "Journal entry covering runtime hardening and stability techniques.",
      isFeatured: false,
    }),
    upsertContent({
    authorId: ownerProfile.id,
      type: "ARTICLE",
      title: "Production Patterns for Next.js App Router + tRPC",
      slug: "production-patterns-nextjs-trpc",
      summary: "A practical guide to route boundaries, mutation workflows, and scalable API design.",
      bodyHtml: articleHtml(
        "Next.js + tRPC Patterns",
        "This article explains a maintainable split between server-rendered pages, typed procedures, and cache invalidation.",
      ),
      bodyJson: null,
      categoryId: webCategory.id,
      tagSlugs: ["nextjs", "typescript", "architecture"],
      seoTitle: "Production Patterns for Next.js and tRPC",
      seoDescription: "Practical architecture patterns for production Next.js App Router projects.",
      isFeatured: true,
    }),
    upsertContent({
    authorId: ownerProfile.id,
      type: "ARTICLE",
      title: "Query Efficiency with Prisma and PostgreSQL",
      slug: "query-efficiency-prisma-postgresql",
      summary: "How to reduce overfetching, avoid N+1 issues, and shape payloads for fast list views.",
      bodyHtml: articleHtml(
        "Efficient Queries",
        "Focus on selecting only needed fields and pairing indexes with actual access patterns.",
      ),
      bodyJson: null,
      categoryId: systemsCategory.id,
      tagSlugs: ["performance", "nodejs", "typescript"],
      seoTitle: "Prisma Query Efficiency Guide",
      seoDescription: "Techniques for efficient Prisma queries in production.",
      isFeatured: false,
    }),
    upsertContent({
    authorId: ownerProfile.id,
      type: "PROJECT",
      title: "Project: Typed Content CMS Foundation",
      slug: "project-typed-content-cms-foundation",
      summary: "A project case study covering auth, CMS architecture, and production deployment readiness.",
      bodyHtml: articleHtml(
        "Typed CMS Foundation",
        "Project notes on combining Clerk, tRPC, Prisma, and editorial UX in a single maintainable platform.",
      ),
      bodyJson: null,
      categoryId: webCategory.id,
      tagSlugs: ["react", "nextjs", "architecture"],
      seoTitle: "Typed Content CMS Foundation Project",
      seoDescription: "Project case study for a production-oriented editorial CMS architecture.",
      isFeatured: true,
    }),
    upsertContent({
    authorId: ownerProfile.id,
      type: "PROJECT",
      title: "Project: Performance and Resilience Audit",
      slug: "project-performance-resilience-audit",
      summary: "Implementation notes for caching, revalidation, pagination, and resilient UI states.",
      bodyHtml: articleHtml(
        "Performance and Resilience Audit",
        "A focused project documenting optimization strategy and failure-tolerant UX for launch readiness.",
      ),
      bodyJson: null,
      categoryId: systemsCategory.id,
      tagSlugs: ["performance", "nextjs", "react"],
      seoTitle: "Performance and Resilience Audit Project",
      seoDescription: "Project summary on performance optimization and resilience design patterns.",
      isFeatured: false,
    }),
  ]);

  const courseA = await seedCourse({
    adminId: owner.id,
    authorId: ownerProfile.id,
    title: "Full-Stack TypeScript Foundations",
    slug: "fullstack-typescript-foundations",
    summary: "Build robust full-stack apps with typed contracts and production discipline.",
    descriptionHtml: articleHtml(
      "Course Overview",
      "This course focuses on practical TypeScript architecture across frontend, backend, and deployment.",
    ),
    isFeatured: true,
    difficultyLevel: "BEGINNER",
    estimatedDurationMinutes: 180,
    seoTitle: "Full-Stack TypeScript Foundations Course",
    seoDescription: "Public course covering robust full-stack TypeScript practices.",
  });

  const courseB = await seedCourse({
    adminId: owner.id,
    authorId: ownerProfile.id,
    title: "Next.js Performance and Deployment",
    slug: "nextjs-performance-deployment",
    summary: "Optimize rendering, caching, and launch workflows for modern App Router apps.",
    descriptionHtml: articleHtml(
      "Course Overview",
      "Covers rendering strategy, revalidation, and deployment workflows with Vercel + Neon.",
    ),
    isFeatured: false,
    difficultyLevel: "INTERMEDIATE",
    estimatedDurationMinutes: 150,
    seoTitle: "Next.js Performance and Deployment Course",
    seoDescription: "Course on production performance and deployment patterns for Next.js.",
  });

  const articleForQuiz = contentEntries.find((item) => item.slug === "production-patterns-nextjs-trpc");

  await seedQuiz({
    adminId: owner.id,
    authorId: ownerProfile.id,
    title: "Web Architecture Fundamentals Quiz",
    slug: "web-architecture-fundamentals-quiz",
    description: "Test your understanding of typed APIs, validation, and scalable route design.",
    contentId: articleForQuiz ? articleForQuiz.id : null,
    courseId: null,
    isFeatured: true,
    passingScore: 2,
    timeLimitMinutes: 10,
    seoTitle: "Web Architecture Fundamentals Quiz",
    seoDescription: "Public quiz on API architecture and full-stack engineering basics.",
  });

  await seedQuiz({
    adminId: owner.id,
    authorId: ownerProfile.id,
    title: "Next.js Deployment Readiness Quiz",
    slug: "nextjs-deployment-readiness-quiz",
    description: "Check your launch-readiness knowledge for production Next.js applications.",
    contentId: null,
    courseId: courseB.id,
    isFeatured: false,
    passingScore: 2,
    timeLimitMinutes: 8,
    seoTitle: "Next.js Deployment Readiness Quiz",
    seoDescription: "Public quiz for deployment and operations fundamentals.",
  });

  console.log("Demo data seeded successfully.");
  console.log("Created/updated content:", contentEntries.map((item) => item.slug));
  console.log("Created/updated courses:", [courseA.slug, courseB.slug]);
  console.log("Created/updated quizzes:", [
    "web-architecture-fundamentals-quiz",
    "nextjs-deployment-readiness-quiz",
  ]);
}

main()
  .catch((error) => {
    console.error("Failed to seed demo content:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
