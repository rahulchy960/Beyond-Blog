import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import {
  AdminRole,
  CommentStatus,
  ContentType,
  CourseDifficultyLevel,
  CourseLessonItemType,
  CourseStatus,
  InteractionTargetType,
  MediaType,
  Prisma,
  PrismaClient,
  PublishStatus,
  QuizQuestionType,
  QuizStatus,
} from "@prisma/client";
import { createHash } from "node:crypto";
import ws from "ws";
import { z } from "zod";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL for Prisma seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString: databaseUrl,
  }),
});

const rawSeedEnvSchema = z.object({
  SINGLE_ADMIN_CLERK_USER_ID: z.string().min(1).optional(),
  SINGLE_ADMIN_EMAIL: z.string().email().optional(),
  SINGLE_ADMIN_FIRST_NAME: z.string().min(1).optional(),
  SINGLE_ADMIN_LAST_NAME: z.string().min(1).optional(),
  ALLOW_ADMIN_REASSIGN: z.enum(["true", "false"]).optional(),
});

type RichSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

type MediaSeed = {
  type: MediaType;
  title: string;
  storageKey: string;
  url: string;
  thumbnailUrl?: string;
  altText: string;
  caption: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  originalFilename: string;
};

type ContentSeed = {
  type: ContentType;
  title: string;
  summary: string;
  categorySlug: string;
  tagSlugs: string[];
  coverKey: string;
  status: PublishStatus;
  isFeatured: boolean;
  createdAt: Date;
  publishedAt?: Date;
  sections: RichSection[];
};

type LessonSeed = {
  title: string;
  summary: string;
  itemType: CourseLessonItemType;
  mediaKey?: string;
  durationMinutes: number;
  isPreview?: boolean;
  sections: RichSection[];
};

type CourseSeed = {
  title: string;
  summary: string;
  coverKey: string;
  difficultyLevel: CourseDifficultyLevel;
  estimatedDurationMinutes: number;
  isFeatured: boolean;
  publishedAt: Date;
  sections: Array<{
    title: string;
    description: string;
    lessons: LessonSeed[];
  }>;
};

type QuizSeed = {
  title: string;
  description: string;
  coverKey: string;
  contentSlug?: string;
  courseSlug?: string;
  questions: Array<{
    text: string;
    explanation: string;
    options: string[];
    correctIndex: number;
  }>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function daysAgo(days: number, hour = 9) {
  const date = new Date();
  date.setUTCHours(hour, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function htmlFromSections(sections: RichSection[]) {
  return sections
    .map((section) => {
      const paragraphs = section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
      const bullets = section.bullets?.length
        ? `<ul>${section.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>`
        : "";
      return `<h2>${section.heading}</h2>${paragraphs}${bullets}`;
    })
    .join("");
}

function richTextJson(sections: RichSection[]): Prisma.InputJsonObject {
  return {
    type: "doc",
    content: sections.flatMap((section) => [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: section.heading }],
      },
      ...section.paragraphs.map((paragraph) => ({
        type: "paragraph",
        content: [{ type: "text", text: paragraph }],
      })),
      ...(section.bullets?.length
        ? [
            {
              type: "bulletList",
              content: section.bullets.map((bullet) => ({
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: bullet }],
                  },
                ],
              })),
            },
          ]
        : []),
    ]),
  };
}

function shortSeoDescription(value: string) {
  return value.length <= 155 ? value : `${value.slice(0, 152).trim()}...`;
}

const mediaSeeds: MediaSeed[] = [
  {
    type: MediaType.IMAGE,
    title: "Editorial Desk at Sunrise",
    storageKey: "demo-uploadthing-image-editorial-desk",
    url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=640&q=70",
    altText: "Laptop, notebook, and coffee on a clean editorial desk.",
    caption: "A calm workspace used for long-form editorial planning.",
    mimeType: "image/jpeg",
    sizeBytes: 428_000,
    width: 1600,
    height: 1067,
    originalFilename: "editorial-desk-sunrise.jpg",
  },
  {
    type: MediaType.IMAGE,
    title: "Product Planning Wall",
    storageKey: "demo-uploadthing-image-product-map",
    url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=640&q=70",
    altText: "Team reviewing product notes and diagrams around a table.",
    caption: "Planning artifacts for product and content systems.",
    mimeType: "image/jpeg",
    sizeBytes: 512_000,
    width: 1600,
    height: 1067,
    originalFilename: "product-planning-wall.jpg",
  },
  {
    type: MediaType.IMAGE,
    title: "Learning Dashboard",
    storageKey: "demo-uploadthing-image-learning-dashboard",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=640&q=70",
    altText: "Analytics dashboard displayed on a laptop screen.",
    caption: "Signals and progress metrics for learning products.",
    mimeType: "image/jpeg",
    sizeBytes: 476_000,
    width: 1600,
    height: 1067,
    originalFilename: "learning-dashboard.jpg",
  },
  {
    type: MediaType.IMAGE,
    title: "Course Recording Studio",
    storageKey: "demo-uploadthing-image-course-studio",
    url: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=640&q=70",
    altText: "Microphone and recording equipment in a studio setup.",
    caption: "A practical setup for recording lessons and walkthroughs.",
    mimeType: "image/jpeg",
    sizeBytes: 458_000,
    width: 1600,
    height: 1067,
    originalFilename: "course-recording-studio.jpg",
  },
  {
    type: MediaType.IMAGE,
    title: "Code Review Session",
    storageKey: "demo-uploadthing-image-code-review",
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=640&q=70",
    altText: "Developer reviewing TypeScript code on a monitor.",
    caption: "Reviewing type-safe application architecture.",
    mimeType: "image/jpeg",
    sizeBytes: 501_000,
    width: 1600,
    height: 1067,
    originalFilename: "code-review-session.jpg",
  },
  {
    type: MediaType.IMAGE,
    title: "Research Notebook",
    storageKey: "demo-uploadthing-image-data-notebook",
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=640&q=70",
    altText: "Notebook and printed charts used for research synthesis.",
    caption: "Structured notes from interviews and product research.",
    mimeType: "image/jpeg",
    sizeBytes: 435_000,
    width: 1600,
    height: 1067,
    originalFilename: "research-notebook.jpg",
  },
  {
    type: MediaType.IMAGE,
    title: "Community Workshop",
    storageKey: "demo-uploadthing-image-community-workshop",
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=640&q=70",
    altText: "Small group workshop with learners collaborating.",
    caption: "Public learning and feedback sessions.",
    mimeType: "image/jpeg",
    sizeBytes: 549_000,
    width: 1600,
    height: 1067,
    originalFilename: "community-workshop.jpg",
  },
  {
    type: MediaType.IMAGE,
    title: "Maya Rao Portrait",
    storageKey: "demo-uploadthing-image-profile-portrait",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=480&q=70",
    altText: "Professional portrait of Beyond Blog founder Maya Rao.",
    caption: "Founder profile image for the footer and about surfaces.",
    mimeType: "image/jpeg",
    sizeBytes: 397_000,
    width: 1200,
    height: 1200,
    originalFilename: "maya-rao-profile.jpg",
  },
  {
    type: MediaType.VIDEO,
    title: "Product Walkthrough Clip",
    storageKey: "demo-uploadthing-video-product-walkthrough",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=640&q=70",
    altText: "Short product walkthrough video placeholder.",
    caption: "A demo video asset used by course lessons.",
    mimeType: "video/mp4",
    sizeBytes: 2_849_000,
    durationSeconds: 15,
    originalFilename: "product-walkthrough.mp4",
  },
  {
    type: MediaType.FILE,
    title: "Research Brief PDF",
    storageKey: "demo-uploadthing-file-research-brief",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    altText: "Downloadable research brief PDF.",
    caption: "A compact research summary attached to a lesson.",
    mimeType: "application/pdf",
    sizeBytes: 132_000,
    originalFilename: "research-brief.pdf",
  },
  {
    type: MediaType.FILE,
    title: "Course Workbook PDF",
    storageKey: "demo-uploadthing-file-course-workbook",
    url: "https://www.orimi.com/pdf-test.pdf",
    altText: "Downloadable course workbook PDF.",
    caption: "Workbook for planning lesson structures.",
    mimeType: "application/pdf",
    sizeBytes: 205_000,
    originalFilename: "course-workbook.pdf",
  },
];

const categorySeeds = [
  "Research Notes",
  "Product Strategy",
  "Engineering",
  "Learning Design",
  "Operations",
  "Community",
].map((name, index) => ({
  name,
  slug: slugify(name),
  description: `Curated ${name.toLowerCase()} from the Beyond Blog archive.`,
  sortOrder: (index + 1) * 10,
}));

const tagSeeds = [
  "Next.js",
  "Prisma",
  "Learning Design",
  "Media Workflow",
  "Content Strategy",
  "Analytics",
  "UX Research",
  "TypeScript",
  "Course Design",
  "Publishing",
  "Product Thinking",
  "Testing",
  "Automation",
  "Community",
  "SEO",
].map((name) => ({ name, slug: slugify(name) }));

const contentSeeds: ContentSeed[] = [
  {
    type: ContentType.ARTICLE,
    title: "Designing a Media-First Editorial System",
    summary:
      "A practical blueprint for making media uploads, selection, and public rendering feel like one connected workflow.",
    categorySlug: "product-strategy",
    tagSlugs: ["media-workflow", "content-strategy", "publishing"],
    coverKey: "demo-uploadthing-image-editorial-desk",
    status: PublishStatus.PUBLISHED,
    isFeatured: true,
    createdAt: daysAgo(42),
    publishedAt: daysAgo(40),
    sections: [
      {
        heading: "Start with the editorial job",
        paragraphs: [
          "A media system fails when uploads are treated as an isolated utility. Editors think in terms of covers, diagrams, attachments, transcripts, and reusable source material.",
          "The cleanest architecture stores uploaded files once, exposes them through a single media library, and lets content forms reference durable media records.",
        ],
        bullets: ["Normalize upload responses.", "Persist media before showing success.", "Render from the same record used by editors."],
      },
      {
        heading: "Make selection explicit",
        paragraphs: [
          "The picker should return a complete media object instead of a loose URL string. That gives the form enough data to show filename, type, preview, alt text, and audit-friendly metadata.",
          "When the selected asset is saved by id, public queries can include the relation and avoid mismatched preview behavior.",
        ],
      },
    ],
  },
  {
    type: ContentType.ARTICLE,
    title: "What I Track Before Refactoring a Feature",
    summary:
      "A refactoring checklist for product teams that need better code without losing behavior that users already rely on.",
    categorySlug: "engineering",
    tagSlugs: ["testing", "typescript", "automation"],
    coverKey: "demo-uploadthing-image-code-review",
    status: PublishStatus.PUBLISHED,
    isFeatured: false,
    createdAt: daysAgo(35),
    publishedAt: daysAgo(34),
    sections: [
      {
        heading: "Map behavior before implementation",
        paragraphs: [
          "Refactoring starts with the contracts that are visible to users and other systems. Screenshots, API payloads, query includes, and error states are more useful than a vague note about cleanup.",
          "Once those contracts are written down, code changes become easier to review because each change has a behavioral purpose.",
        ],
        bullets: ["List entry points.", "Capture current edge cases.", "Write one regression test for the riskiest path."],
      },
      {
        heading: "Keep migrations boring",
        paragraphs: [
          "A schema change should be as small as the product requirement allows. If a relation is needed, add it deliberately and include the exact read path that will consume it.",
        ],
      },
    ],
  },
  {
    type: ContentType.ARTICLE,
    title: "A Field Guide to Useful Analytics Dashboards",
    summary:
      "How to design dashboards that answer operating questions instead of decorating a reporting page.",
    categorySlug: "operations",
    tagSlugs: ["analytics", "product-thinking", "seo"],
    coverKey: "demo-uploadthing-image-learning-dashboard",
    status: PublishStatus.PUBLISHED,
    isFeatured: true,
    createdAt: daysAgo(28),
    publishedAt: daysAgo(26),
    sections: [
      {
        heading: "Choose questions before charts",
        paragraphs: [
          "A useful dashboard starts with the decisions people make every week. If a chart does not change a decision, it is usually noise.",
          "For editorial products, the strongest metrics pair engagement with completion, search behavior, and repeat visits.",
        ],
      },
      {
        heading: "Tell the team what changed",
        paragraphs: [
          "Dashboards should make movement obvious. Annotations, release markers, and consistent time ranges make the difference between a chart and an operating system.",
        ],
      },
    ],
  },
  {
    type: ContentType.ARTICLE,
    title: "Draft: Search Patterns for Learning Libraries",
    summary:
      "A draft exploration of filters, semantic search, and guided discovery in course-heavy content libraries.",
    categorySlug: "learning-design",
    tagSlugs: ["learning-design", "course-design", "ux-research"],
    coverKey: "demo-uploadthing-image-data-notebook",
    status: PublishStatus.DRAFT,
    isFeatured: false,
    createdAt: daysAgo(10),
    sections: [
      {
        heading: "Discovery is a curriculum problem",
        paragraphs: [
          "Search is not only a retrieval feature. In a learning library, search helps people decide what to study next and how much context they need before starting.",
        ],
      },
    ],
  },
  {
    type: ContentType.JOURNAL,
    title: "Shipping Notes: The Week We Fixed Media Persistence",
    summary:
      "A journal entry about turning upload success into durable app state, with notes on testing and cache invalidation.",
    categorySlug: "engineering",
    tagSlugs: ["media-workflow", "testing", "prisma"],
    coverKey: "demo-uploadthing-image-code-review",
    status: PublishStatus.PUBLISHED,
    isFeatured: true,
    createdAt: daysAgo(18),
    publishedAt: daysAgo(17),
    sections: [
      {
        heading: "The real bug was after transport",
        paragraphs: [
          "The upload provider accepted files correctly, but the application had no durable media record to show after the callback finished.",
          "The fix was to treat media registration as part of the upload success path, not as a later optional step.",
        ],
      },
    ],
  },
  {
    type: ContentType.JOURNAL,
    title: "Notes from a Community Feedback Session",
    summary:
      "What readers asked for after using the first version of courses, comments, and quizzes.",
    categorySlug: "community",
    tagSlugs: ["community", "ux-research", "learning-design"],
    coverKey: "demo-uploadthing-image-community-workshop",
    status: PublishStatus.PUBLISHED,
    isFeatured: false,
    createdAt: daysAgo(24),
    publishedAt: daysAgo(23),
    sections: [
      {
        heading: "Feedback clustered around confidence",
        paragraphs: [
          "Readers wanted clearer signals about difficulty, expected time, and whether a lesson was conceptual or practical.",
          "The quiz results were most useful when explanations appeared immediately after submission.",
        ],
      },
    ],
  },
  {
    type: ContentType.JOURNAL,
    title: "What Changed After Adding Quizzes",
    summary:
      "Reflections on how lightweight assessments changed the way people moved through long-form content.",
    categorySlug: "learning-design",
    tagSlugs: ["course-design", "analytics", "community"],
    coverKey: "demo-uploadthing-image-learning-dashboard",
    status: PublishStatus.PUBLISHED,
    isFeatured: false,
    createdAt: daysAgo(16),
    publishedAt: daysAgo(15),
    sections: [
      {
        heading: "Small checks change reading behavior",
        paragraphs: [
          "Quizzes gave readers a reason to pause and apply a concept before moving on. The effect was strongest in lessons that included examples.",
        ],
      },
    ],
  },
  {
    type: ContentType.JOURNAL,
    title: "Draft: A Better Way to Plan Editorial Sprints",
    summary:
      "A working note on planning article, project, and course releases as one editorial cadence.",
    categorySlug: "operations",
    tagSlugs: ["publishing", "automation", "product-thinking"],
    coverKey: "demo-uploadthing-image-product-map",
    status: PublishStatus.DRAFT,
    isFeatured: false,
    createdAt: daysAgo(8),
    sections: [
      {
        heading: "Planning starts with reusable assets",
        paragraphs: [
          "The same research note can become an article section, a course activity, and a quiz explanation when the editorial system is planned around reuse.",
        ],
      },
    ],
  },
  {
    type: ContentType.PROJECT,
    title: "Beyond Blog Media Library",
    summary:
      "A project case study for building a media library that supports upload, reuse, metadata, and cover image workflows.",
    categorySlug: "engineering",
    tagSlugs: ["media-workflow", "next-js", "prisma"],
    coverKey: "demo-uploadthing-image-editorial-desk",
    status: PublishStatus.PUBLISHED,
    isFeatured: true,
    createdAt: daysAgo(31),
    publishedAt: daysAgo(30),
    sections: [
      {
        heading: "Problem statement",
        paragraphs: [
          "Editors needed a reliable way to reuse uploaded assets across posts, courses, and lesson resources without manually copying URLs.",
          "The implementation centers on a MediaAsset record that owns the renderable URL and provider metadata.",
        ],
      },
    ],
  },
  {
    type: ContentType.PROJECT,
    title: "Reader Interaction Layer",
    summary:
      "A project snapshot covering anonymous likes, visible comments, moderation states, and quiz attempts.",
    categorySlug: "community",
    tagSlugs: ["community", "testing", "product-thinking"],
    coverKey: "demo-uploadthing-image-community-workshop",
    status: PublishStatus.PUBLISHED,
    isFeatured: false,
    createdAt: daysAgo(29),
    publishedAt: daysAgo(28),
    sections: [
      {
        heading: "Public interaction without public accounts",
        paragraphs: [
          "Beyond Blog keeps public participation lightweight. Readers can comment, like, and complete quizzes without creating an account.",
          "The admin remains the only authenticated user, which keeps the moderation model simple.",
        ],
      },
    ],
  },
  {
    type: ContentType.PROJECT,
    title: "Course Builder for Independent Experts",
    summary:
      "A practical course authoring project that combines sections, lessons, media assets, and quizzes.",
    categorySlug: "learning-design",
    tagSlugs: ["course-design", "learning-design", "media-workflow"],
    coverKey: "demo-uploadthing-image-course-studio",
    status: PublishStatus.PUBLISHED,
    isFeatured: true,
    createdAt: daysAgo(22),
    publishedAt: daysAgo(21),
    sections: [
      {
        heading: "Courses need editorial structure",
        paragraphs: [
          "A useful course builder should make hierarchy obvious. Sections group intent, lessons deliver one outcome, and media records attach durable resources.",
        ],
      },
    ],
  },
  {
    type: ContentType.PROJECT,
    title: "Draft: Semantic Discovery Experiments",
    summary:
      "Prototype notes for a search and recommendation layer across content, courses, and quizzes.",
    categorySlug: "product-strategy",
    tagSlugs: ["automation", "seo", "ux-research"],
    coverKey: "demo-uploadthing-image-data-notebook",
    status: PublishStatus.DRAFT,
    isFeatured: false,
    createdAt: daysAgo(6),
    sections: [
      {
        heading: "The next layer is intent",
        paragraphs: [
          "Keyword search is useful, but a learning archive also needs intent-aware recommendations that can distinguish browsing from active study.",
        ],
      },
    ],
  },
];

const courseSeeds: CourseSeed[] = [
  {
    title: "Build a Production-Ready Editorial Platform",
    summary: "Design and ship a robust content platform with media, publishing, and admin workflows.",
    coverKey: "demo-uploadthing-image-course-studio",
    difficultyLevel: CourseDifficultyLevel.INTERMEDIATE,
    estimatedDurationMinutes: 240,
    isFeatured: true,
    publishedAt: daysAgo(20),
    sections: [
      {
        title: "System Foundations",
        description: "Establish the architecture and data contracts for a production editorial system.",
        lessons: [
          {
            title: "Define the Product Rules",
            summary: "Translate editorial requirements into enforceable application constraints.",
            itemType: CourseLessonItemType.RICH_TEXT,
            durationMinutes: 24,
            isPreview: true,
            sections: [
              {
                heading: "Rules before screens",
                paragraphs: [
                  "A content platform is easier to maintain when product rules are written down before components are built.",
                ],
                bullets: ["Single admin ownership.", "Published-only public data.", "Durable media records."],
              },
            ],
          },
          {
            title: "Model Content and Media Relations",
            summary: "Use relational records for cover images, lesson media, and reusable library assets.",
            itemType: CourseLessonItemType.IMAGE,
            mediaKey: "demo-uploadthing-image-editorial-desk",
            durationMinutes: 32,
            sections: [
              {
                heading: "Reference assets by id",
                paragraphs: [
                  "The form should save a media id, while the read query includes the media relation needed for preview and public rendering.",
                ],
              },
            ],
          },
        ],
      },
      {
        title: "Admin Experience",
        description: "Build workflows that keep editors confident while they create and revise content.",
        lessons: [
          {
            title: "Design a Reliable Media Picker",
            summary: "Keep upload, registration, selection, and preview in one predictable flow.",
            itemType: CourseLessonItemType.VIDEO,
            mediaKey: "demo-uploadthing-video-product-walkthrough",
            durationMinutes: 38,
            sections: [
              {
                heading: "Selection is a contract",
                paragraphs: [
                  "A picker should return the complete MediaAsset object so the parent form can update both its field value and preview state.",
                ],
              },
            ],
          },
          {
            title: "Moderate Public Contributions",
            summary: "Keep guest interaction public while preserving admin control over visibility.",
            itemType: CourseLessonItemType.RICH_TEXT,
            durationMinutes: 26,
            sections: [
              {
                heading: "Moderation states matter",
                paragraphs: [
                  "Visible, pending, hidden, and deleted comments tell different operational stories and should be represented explicitly.",
                ],
              },
            ],
          },
        ],
      },
      {
        title: "Launch Readiness",
        description: "Verify the public experience and operational checks before launch.",
        lessons: [
          {
            title: "Create a Release Checklist",
            summary: "Test content cards, detail pages, quizzes, comments, and media rendering together.",
            itemType: CourseLessonItemType.RESOURCE,
            mediaKey: "demo-uploadthing-file-course-workbook",
            durationMinutes: 30,
            sections: [
              {
                heading: "A checklist protects the experience",
                paragraphs: [
                  "The most useful checks follow the user journey from homepage to detail page to interaction completion.",
                ],
              },
            ],
          },
          {
            title: "Read Production Signals",
            summary: "Track useful metrics without turning the dashboard into a vanity board.",
            itemType: CourseLessonItemType.IMAGE,
            mediaKey: "demo-uploadthing-image-learning-dashboard",
            durationMinutes: 28,
            sections: [
              {
                heading: "Signals beat volume",
                paragraphs: [
                  "The goal is not more charts. The goal is faster decisions about what to improve next.",
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Practical Learning Design for Builders",
    summary: "Turn expertise into courses, lessons, exercises, and assessment loops that learners can finish.",
    coverKey: "demo-uploadthing-image-community-workshop",
    difficultyLevel: CourseDifficultyLevel.BEGINNER,
    estimatedDurationMinutes: 195,
    isFeatured: false,
    publishedAt: daysAgo(14),
    sections: [
      {
        title: "Learning Outcomes",
        description: "Plan lessons around measurable outcomes rather than a list of topics.",
        lessons: [
          {
            title: "Write Outcomes Learners Can Use",
            summary: "Convert vague goals into observable learner behaviors.",
            itemType: CourseLessonItemType.RICH_TEXT,
            durationMinutes: 22,
            isPreview: true,
            sections: [
              {
                heading: "Outcomes guide decisions",
                paragraphs: [
                  "A strong outcome tells you what to include, what to remove, and how to assess the lesson.",
                ],
              },
            ],
          },
          {
            title: "Choose the Right Activity",
            summary: "Match activities to the kind of confidence the learner needs to build.",
            itemType: CourseLessonItemType.IMAGE,
            mediaKey: "demo-uploadthing-image-data-notebook",
            durationMinutes: 27,
            sections: [
              {
                heading: "Activity follows evidence",
                paragraphs: [
                  "Reading, practicing, reflecting, and explaining create different evidence. Choose the activity that reveals the outcome.",
                ],
              },
            ],
          },
        ],
      },
      {
        title: "Lesson Structure",
        description: "Design lessons that stay focused and easy to complete.",
        lessons: [
          {
            title: "Build the Lesson Spine",
            summary: "Use a repeatable structure for explanation, example, practice, and reflection.",
            itemType: CourseLessonItemType.RESOURCE,
            mediaKey: "demo-uploadthing-file-research-brief",
            durationMinutes: 34,
            sections: [
              {
                heading: "Structure reduces friction",
                paragraphs: [
                  "Learners finish more lessons when the lesson shape is predictable and the task is clear.",
                ],
              },
            ],
          },
          {
            title: "Use Media with Purpose",
            summary: "Decide when a video, image, or file actually improves the learning moment.",
            itemType: CourseLessonItemType.VIDEO,
            mediaKey: "demo-uploadthing-video-product-walkthrough",
            durationMinutes: 31,
            sections: [
              {
                heading: "Media should carry meaning",
                paragraphs: [
                  "A video is useful when motion or walkthrough context matters. A file is useful when learners need a reusable artifact.",
                ],
              },
            ],
          },
        ],
      },
      {
        title: "Feedback Loops",
        description: "Add lightweight checks that help learners see progress.",
        lessons: [
          {
            title: "Design Useful Quiz Explanations",
            summary: "Write explanations that teach, not just grade.",
            itemType: CourseLessonItemType.RICH_TEXT,
            durationMinutes: 24,
            sections: [
              {
                heading: "The explanation is the lesson",
                paragraphs: [
                  "A good quiz explanation names the principle behind the answer and gives learners a way to apply it next time.",
                ],
              },
            ],
          },
          {
            title: "Review Completion Data",
            summary: "Use attempts and comments to understand where learners slow down.",
            itemType: CourseLessonItemType.IMAGE,
            mediaKey: "demo-uploadthing-image-learning-dashboard",
            durationMinutes: 29,
            sections: [
              {
                heading: "Look for friction",
                paragraphs: [
                  "Completion data becomes useful when it is paired with learner comments and review of the lesson itself.",
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Type-Safe Product Systems with Next.js",
    summary: "Build safer product workflows with TypeScript, Prisma, tRPC, and well-defined UI contracts.",
    coverKey: "demo-uploadthing-image-code-review",
    difficultyLevel: CourseDifficultyLevel.ADVANCED,
    estimatedDurationMinutes: 260,
    isFeatured: true,
    publishedAt: daysAgo(11),
    sections: [
      {
        title: "Contracts",
        description: "Define boundaries for schema, API, and UI state.",
        lessons: [
          {
            title: "Use Zod at the API Edge",
            summary: "Validate mutation inputs where application behavior crosses trust boundaries.",
            itemType: CourseLessonItemType.RICH_TEXT,
            durationMinutes: 36,
            isPreview: true,
            sections: [
              {
                heading: "Validation is product logic",
                paragraphs: [
                  "A schema documents what a user is allowed to do and protects the database from partial or ambiguous state.",
                ],
              },
            ],
          },
          {
            title: "Keep Prisma as the Database Boundary",
            summary: "Use Prisma as the only write path and keep relation includes intentional.",
            itemType: CourseLessonItemType.IMAGE,
            mediaKey: "demo-uploadthing-image-code-review",
            durationMinutes: 42,
            sections: [
              {
                heading: "Query shape is a contract",
                paragraphs: [
                  "If the editor needs cover image metadata, the edit query should include the cover image relation explicitly.",
                ],
              },
            ],
          },
        ],
      },
      {
        title: "State and Cache",
        description: "Keep client state aligned with server state.",
        lessons: [
          {
            title: "Invalidate the Query You Render",
            summary: "Avoid stale UI by invalidating the same tRPC query that powers the grid.",
            itemType: CourseLessonItemType.RICH_TEXT,
            durationMinutes: 33,
            sections: [
              {
                heading: "Cache keys are part of the feature",
                paragraphs: [
                  "A mutation is incomplete until the user-facing query is refetched or updated optimistically.",
                ],
              },
            ],
          },
          {
            title: "Avoid Fake Local Success",
            summary: "Show upload success only after durable registration succeeds.",
            itemType: CourseLessonItemType.VIDEO,
            mediaKey: "demo-uploadthing-video-product-walkthrough",
            durationMinutes: 30,
            sections: [
              {
                heading: "Persistence first",
                paragraphs: [
                  "Local previews are useful, but they cannot substitute for a database record the rest of the app can query.",
                ],
              },
            ],
          },
        ],
      },
      {
        title: "Testing Critical Paths",
        description: "Test behavior that would break production workflows.",
        lessons: [
          {
            title: "Write Integration Tests for Procedures",
            summary: "Exercise tRPC procedures without rendering UI.",
            itemType: CourseLessonItemType.RICH_TEXT,
            durationMinutes: 39,
            sections: [
              {
                heading: "Procedures own the rules",
                paragraphs: [
                  "The API layer is the right place to test admin authorization, validation, persistence, and expected relation includes.",
                ],
              },
            ],
          },
          {
            title: "Create Real Demo Data",
            summary: "Seed realistic, interlinked data so the UI can be evaluated as a product.",
            itemType: CourseLessonItemType.RESOURCE,
            mediaKey: "demo-uploadthing-file-course-workbook",
            durationMinutes: 28,
            sections: [
              {
                heading: "Demo data should carry context",
                paragraphs: [
                  "Good seed data exposes empty states, populated states, published data, drafts, and relationship-heavy surfaces.",
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const quizSeeds: QuizSeed[] = [
  {
    title: "Media Workflow Readiness Check",
    description: "Check whether you understand the durable upload and media selection flow.",
    coverKey: "demo-uploadthing-image-editorial-desk",
    contentSlug: "designing-a-media-first-editorial-system",
    questions: [
      {
        text: "What should happen immediately after UploadThing returns a successful upload response?",
        options: ["Show success and stop", "Register a durable MediaAsset record", "Reload the browser", "Store only a local preview"],
        correctIndex: 1,
        explanation: "The app needs a database record before the rest of the media library can render the asset.",
      },
      {
        text: "Which field should be used by public rendering for uploaded media?",
        options: ["The renderable URL saved on MediaAsset", "A temporary object URL", "The original local filename", "A toast message id"],
        correctIndex: 0,
        explanation: "Public pages should render the persisted media URL returned by the upload provider.",
      },
      {
        text: "Why should a media picker return the full MediaAsset object?",
        options: ["It avoids every server request forever", "It gives the parent form preview and metadata immediately", "It hides validation errors", "It bypasses authorization"],
        correctIndex: 1,
        explanation: "The parent can update the stored id and display filename, preview, type, and alt text.",
      },
      {
        text: "What cache action is expected after media registration?",
        options: ["Invalidate the media list query", "Clear all cookies", "Delete draft content", "Disable the picker"],
        correctIndex: 0,
        explanation: "The grid and picker need to refetch the same source-of-truth query.",
      },
    ],
  },
  {
    title: "Learning Design Fundamentals",
    description: "Assess the foundations of outcomes, activities, and feedback loops.",
    coverKey: "demo-uploadthing-image-community-workshop",
    courseSlug: "practical-learning-design-builders",
    questions: [
      {
        text: "What should a strong lesson outcome describe?",
        options: ["A broad topic area", "Observable learner behavior", "The instructor's preference", "The final video length"],
        correctIndex: 1,
        explanation: "Outcomes should describe what learners can do after the lesson.",
      },
      {
        text: "When is video the right lesson media?",
        options: ["Whenever a page looks empty", "When motion or walkthrough context matters", "Only for introductions", "Never"],
        correctIndex: 1,
        explanation: "Video is strongest when it demonstrates change over time or a workflow.",
      },
      {
        text: "What makes quiz feedback useful?",
        options: ["It only says correct or incorrect", "It teaches the principle behind the answer", "It hides all answers", "It replaces the lesson"],
        correctIndex: 1,
        explanation: "Explanations should help learners transfer the idea to the next situation.",
      },
      {
        text: "Why review comments with completion data?",
        options: ["To find friction points", "To increase file size", "To avoid moderation", "To remove lesson summaries"],
        correctIndex: 0,
        explanation: "Qualitative feedback explains the numbers and points to specific improvements.",
      },
    ],
  },
  {
    title: "Type-Safe Next.js Systems Quiz",
    description: "Check your understanding of validation, persistence, and cache contracts.",
    coverKey: "demo-uploadthing-image-code-review",
    courseSlug: "type-safe-product-systems-nextjs",
    questions: [
      {
        text: "Where should mutation inputs be validated?",
        options: ["At the API boundary", "Only in CSS", "Only in the database console", "Nowhere"],
        correctIndex: 0,
        explanation: "The API boundary is where untrusted input becomes application behavior.",
      },
      {
        text: "Why include relations in edit queries?",
        options: ["To support previews that need related metadata", "To slow down every query intentionally", "To avoid forms", "To remove foreign keys"],
        correctIndex: 0,
        explanation: "Editors need selected media metadata, not only the stored foreign key.",
      },
      {
        text: "What should happen if upload succeeds but app registration fails?",
        options: ["Pretend the asset is available", "Show a clear registration error", "Publish all drafts", "Log out the admin"],
        correctIndex: 1,
        explanation: "The app should not claim success when the durable app record does not exist.",
      },
      {
        text: "Which layer should directly access Postgres?",
        options: ["Prisma", "Random React components", "Public comments UI", "CSS modules"],
        correctIndex: 0,
        explanation: "Prisma is the database access boundary in this architecture.",
      },
      {
        text: "What does deterministic seed data help test?",
        options: ["Only database deletion", "Real UI states and repeatable relationships", "Random junk content", "Secret rotation"],
        correctIndex: 1,
        explanation: "Predictable, realistic data makes visual and behavioral regressions easier to spot.",
      },
    ],
  },
];

async function seedAdmin() {
  const rawEnv = rawSeedEnvSchema.parse(process.env);
  const existingOwner = await prisma.adminUser.findUnique({
    where: { role: AdminRole.OWNER },
  });

  const adminInput = {
    clerkUserId: rawEnv.SINGLE_ADMIN_CLERK_USER_ID ?? existingOwner?.clerkUserId ?? "demo_beyond_blog_admin",
    email: rawEnv.SINGLE_ADMIN_EMAIL ?? existingOwner?.email ?? "admin@beyondblog.dev",
    firstName: rawEnv.SINGLE_ADMIN_FIRST_NAME ?? existingOwner?.firstName ?? "Maya",
    lastName: rawEnv.SINGLE_ADMIN_LAST_NAME ?? existingOwner?.lastName ?? "Rao",
  };

  if (
    existingOwner &&
    existingOwner.clerkUserId !== adminInput.clerkUserId &&
    rawEnv.ALLOW_ADMIN_REASSIGN !== "true"
  ) {
    throw new Error(
      `Owner admin is already assigned to clerkUserId=${existingOwner.clerkUserId}. Set ALLOW_ADMIN_REASSIGN=true to reassign intentionally.`,
    );
  }

  return prisma.adminUser.upsert({
    where: { role: AdminRole.OWNER },
    update: {
      clerkUserId: adminInput.clerkUserId,
      email: adminInput.email,
      firstName: adminInput.firstName,
      lastName: adminInput.lastName,
      isActive: true,
    },
    create: {
      role: AdminRole.OWNER,
      clerkUserId: adminInput.clerkUserId,
      email: adminInput.email,
      firstName: adminInput.firstName,
      lastName: adminInput.lastName,
      isActive: true,
    },
  });
}

async function seedMedia(adminId: string) {
  const media = new Map<string, Awaited<ReturnType<typeof prisma.mediaAsset.upsert>>>();

  for (const item of mediaSeeds) {
    const asset = await prisma.mediaAsset.upsert({
      where: {
        storageProvider_storageKey: {
          storageProvider: "uploadthing",
          storageKey: item.storageKey,
        },
      },
      update: {
        type: item.type,
        title: item.title,
        providerAssetId: item.storageKey,
        externalUrl: item.url,
        playbackUrl: item.type === MediaType.VIDEO ? item.url : null,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl ?? null,
        altText: item.altText,
        caption: item.caption,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        width: item.width ?? null,
        height: item.height ?? null,
        durationSeconds: item.durationSeconds ?? null,
        originalFilename: item.originalFilename,
        uploadedByAdminId: adminId,
      },
      create: {
        type: item.type,
        title: item.title,
        storageProvider: "uploadthing",
        storageKey: item.storageKey,
        providerAssetId: item.storageKey,
        externalUrl: item.url,
        playbackUrl: item.type === MediaType.VIDEO ? item.url : null,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl ?? null,
        altText: item.altText,
        caption: item.caption,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        width: item.width ?? null,
        height: item.height ?? null,
        durationSeconds: item.durationSeconds ?? null,
        originalFilename: item.originalFilename,
        uploadedByAdminId: adminId,
      },
    });
    media.set(item.storageKey, asset);
  }

  return media;
}

async function seedTaxonomy() {
  const categories = new Map<string, Awaited<ReturnType<typeof prisma.category.upsert>>>();
  const tags = new Map<string, Awaited<ReturnType<typeof prisma.tag.upsert>>>();

  for (const category of categorySeeds) {
    categories.set(
      category.slug,
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      }),
    );
  }

  for (const tag of tagSeeds) {
    tags.set(
      tag.slug,
      await prisma.tag.upsert({
        where: { slug: tag.slug },
        update: { name: tag.name },
        create: tag,
      }),
    );
  }

  return { categories, tags };
}

async function seedContent(params: {
  adminId: string;
  media: Map<string, { id: string }>;
  categories: Map<string, { id: string }>;
  tags: Map<string, { id: string }>;
}) {
  const contentBySlug = new Map<string, Awaited<ReturnType<typeof prisma.content.upsert>>>();

  for (const item of contentSeeds) {
    const slug = slugify(item.title);
    const coverImage = params.media.get(item.coverKey);
    const category = params.categories.get(item.categorySlug);

    if (!coverImage) {
      throw new Error(`Missing media seed for ${item.coverKey}.`);
    }
    if (!category) {
      throw new Error(`Missing category seed for ${item.categorySlug}.`);
    }

    const content = await prisma.content.upsert({
      where: { slug },
      update: {
        title: item.title,
        summary: item.summary,
        bodyHtml: htmlFromSections(item.sections),
        bodyJson: richTextJson(item.sections),
        type: item.type,
        publishStatus: item.status,
        isFeatured: item.isFeatured,
        seoTitle: `${item.title} | Beyond Blog`,
        seoDescription: shortSeoDescription(item.summary),
        publishedAt: item.publishedAt ?? null,
        authorId: params.adminId,
        categoryId: category.id,
        coverImageAssetId: coverImage.id,
        createdAt: item.createdAt,
      },
      create: {
        title: item.title,
        slug,
        summary: item.summary,
        bodyHtml: htmlFromSections(item.sections),
        bodyJson: richTextJson(item.sections),
        type: item.type,
        publishStatus: item.status,
        isFeatured: item.isFeatured,
        seoTitle: `${item.title} | Beyond Blog`,
        seoDescription: shortSeoDescription(item.summary),
        publishedAt: item.publishedAt ?? null,
        authorId: params.adminId,
        categoryId: category.id,
        coverImageAssetId: coverImage.id,
        createdAt: item.createdAt,
      },
    });

    await prisma.contentTag.deleteMany({ where: { contentId: content.id } });
    await prisma.contentTag.createMany({
      data: item.tagSlugs.map((tagSlug) => {
        const tag = params.tags.get(tagSlug);
        if (!tag) {
          throw new Error(`Missing tag seed for ${tagSlug}.`);
        }
        return { contentId: content.id, tagId: tag.id };
      }),
      skipDuplicates: true,
    });

    contentBySlug.set(slug, content);
  }

  return contentBySlug;
}

async function seedCourses(params: {
  adminId: string;
  media: Map<string, { id: string }>;
}) {
  const courses = new Map<string, Awaited<ReturnType<typeof prisma.course.upsert>>>();

  for (const item of courseSeeds) {
    const slug = slugify(item.title);
    const coverImage = params.media.get(item.coverKey);
    if (!coverImage) {
      throw new Error(`Missing course cover media seed for ${item.coverKey}.`);
    }

    const descriptionSections: RichSection[] = [
      {
        heading: "Course overview",
        paragraphs: [item.summary, "Each lesson is designed to produce a visible artifact or decision that moves a real product forward."],
      },
    ];

    const course = await prisma.course.upsert({
      where: { slug },
      update: {
        title: item.title,
        summary: item.summary,
        descriptionHtml: htmlFromSections(descriptionSections),
        descriptionJson: richTextJson(descriptionSections),
        coverImageId: coverImage.id,
        difficultyLevel: item.difficultyLevel,
        estimatedDurationMinutes: item.estimatedDurationMinutes,
        isFeatured: item.isFeatured,
        status: CourseStatus.PUBLISHED,
        seoTitle: `${item.title} | Beyond Blog Courses`,
        seoDescription: shortSeoDescription(item.summary),
        publishedAt: item.publishedAt,
        createdByAdminId: params.adminId,
      },
      create: {
        title: item.title,
        slug,
        summary: item.summary,
        descriptionHtml: htmlFromSections(descriptionSections),
        descriptionJson: richTextJson(descriptionSections),
        coverImageId: coverImage.id,
        difficultyLevel: item.difficultyLevel,
        estimatedDurationMinutes: item.estimatedDurationMinutes,
        isFeatured: item.isFeatured,
        status: CourseStatus.PUBLISHED,
        seoTitle: `${item.title} | Beyond Blog Courses`,
        seoDescription: shortSeoDescription(item.summary),
        publishedAt: item.publishedAt,
        createdByAdminId: params.adminId,
        createdAt: item.publishedAt,
      },
    });

    await prisma.courseLesson.deleteMany({ where: { courseId: course.id } });
    await prisma.courseSection.deleteMany({ where: { courseId: course.id } });

    for (const [sectionIndex, sectionSeed] of item.sections.entries()) {
      const section = await prisma.courseSection.create({
        data: {
          courseId: course.id,
          title: sectionSeed.title,
          description: sectionSeed.description,
          order: (sectionIndex + 1) * 10,
        },
      });

      for (const [lessonIndex, lessonSeed] of sectionSeed.lessons.entries()) {
        const mediaAsset = lessonSeed.mediaKey ? params.media.get(lessonSeed.mediaKey) : undefined;
        if (lessonSeed.mediaKey && !mediaAsset) {
          throw new Error(`Missing lesson media seed for ${lessonSeed.mediaKey}.`);
        }

        await prisma.courseLesson.create({
          data: {
            courseId: course.id,
            sectionId: section.id,
            title: lessonSeed.title,
            slug: slugify(lessonSeed.title),
            summary: lessonSeed.summary,
            order: (lessonIndex + 1) * 10,
            itemType: lessonSeed.itemType,
            bodyHtml: htmlFromSections(lessonSeed.sections),
            bodyJson: richTextJson(lessonSeed.sections),
            mediaAssetId: mediaAsset?.id ?? null,
            durationMinutes: lessonSeed.durationMinutes,
            isPreview: lessonSeed.isPreview ?? false,
            publishedAt: item.publishedAt,
          },
        });
      }
    }

    courses.set(slug, course);
  }

  return courses;
}

async function seedComments(contentBySlug: Map<string, { id: string; slug: string }>) {
  await prisma.comment.deleteMany({
    where: { guestEmail: { startsWith: "demo." } },
  });

  const content = Array.from(contentBySlug.values());
  const comments = [
    ["Aarav Mehta", "This clarified why upload success is not the same as app persistence.", CommentStatus.VISIBLE],
    ["Nina Patel", "The distinction between selected media state and saved media relation is useful.", CommentStatus.VISIBLE],
    ["Jon Bell", "I would like a deeper follow-up on cache invalidation across picker and library views.", CommentStatus.PENDING],
    ["Priya Sen", "The course structure examples are practical enough to reuse in my own planning.", CommentStatus.VISIBLE],
    ["Leo Martin", "The analytics article helped me remove three charts from our dashboard.", CommentStatus.VISIBLE],
    ["Samira Khan", "The product rules framing is exactly what our editorial system was missing.", CommentStatus.VISIBLE],
    ["Owen Clark", "This draft has a promising angle, but the search examples need more specificity.", CommentStatus.HIDDEN],
    ["Mira Bose", "The quiz explanations are short, but they actually teach the underlying decision.", CommentStatus.VISIBLE],
    ["Daniel Yu", "I appreciate the single-admin model because it keeps the public surface simple.", CommentStatus.VISIBLE],
    ["Elena Ross", "The media library project reads like a real implementation note, not just a showcase.", CommentStatus.VISIBLE],
    ["Kavya Iyer", "Please add a checklist for verifying public rendering after changing cover images.", CommentStatus.PENDING],
    ["Noah Reed", "The lesson on choosing media with purpose is the one I needed most.", CommentStatus.VISIBLE],
    ["Farah Ali", "The testing guidance is pragmatic and easy to defend in review.", CommentStatus.VISIBLE],
    ["Mateo Silva", "Draft planning around reusable assets matches how our team actually ships.", CommentStatus.VISIBLE],
    ["Iris Chen", "The article makes a strong case for treating query shape as a UI contract.", CommentStatus.VISIBLE],
  ] as const;

  await prisma.comment.createMany({
    data: comments.map(([name, body, status], index) => {
      const target = content[index % content.length];
      return {
        targetType: InteractionTargetType.CONTENT,
        contentId: target.id,
        guestName: name,
        guestEmail: `demo.${slugify(name)}@example.com`,
        guestFingerprintHash: hash(`demo-comment-${name}`),
        body,
        status,
        moderationNote: status === CommentStatus.HIDDEN ? "Demo hidden comment for moderation UI." : null,
        createdAt: daysAgo(14 - (index % 10), 8 + (index % 8)),
      };
    }),
  });
}

async function seedLikes(contentBySlug: Map<string, { id: string; slug: string; publishStatus: PublishStatus }>) {
  await prisma.contentLike.deleteMany({
    where: { visitorTokenHash: { startsWith: "demo-like-" } },
  });

  const publishedContent = Array.from(contentBySlug.values()).filter(
    (content) => content.publishStatus === PublishStatus.PUBLISHED,
  );

  const likeRows = publishedContent.flatMap((content, contentIndex) => {
    const count = 2 + ((contentIndex * 3) % 9);
    return Array.from({ length: count }, (_, likeIndex) => ({
      targetType: InteractionTargetType.CONTENT,
      contentId: content.id,
      visitorTokenHash: `demo-like-${content.slug}-${likeIndex}`,
      createdAt: daysAgo(12 - (likeIndex % 10), 7 + (likeIndex % 9)),
    }));
  });

  await prisma.contentLike.createMany({
    data: likeRows,
    skipDuplicates: true,
  });
}

async function seedQuizzes(params: {
  adminId: string;
  media: Map<string, { id: string }>;
  contentBySlug: Map<string, { id: string }>;
  courses: Map<string, { id: string }>;
}) {
  for (const item of quizSeeds) {
    const slug = slugify(item.title);
    const existingQuiz = await prisma.quiz.findUnique({ where: { slug } });
    if (existingQuiz) {
      await prisma.quizAnswer.deleteMany({ where: { attempt: { quizId: existingQuiz.id } } });
      await prisma.quizAttempt.deleteMany({ where: { quizId: existingQuiz.id } });
      await prisma.quizOption.deleteMany({ where: { question: { quizId: existingQuiz.id } } });
      await prisma.quizQuestion.deleteMany({ where: { quizId: existingQuiz.id } });
    }

    const coverImage = params.media.get(item.coverKey);
    if (!coverImage) {
      throw new Error(`Missing quiz cover media seed for ${item.coverKey}.`);
    }

    const quiz = await prisma.quiz.upsert({
      where: { slug },
      update: {
        title: item.title,
        description: item.description,
        status: QuizStatus.PUBLISHED,
        isFeatured: true,
        showAnswersAfterSubmit: true,
        allowMultipleAttempts: true,
        timeLimitMinutes: 12,
        passingScore: Math.ceil(item.questions.length * 0.7),
        contentId: item.contentSlug ? params.contentBySlug.get(item.contentSlug)?.id : null,
        courseId: item.courseSlug ? params.courses.get(item.courseSlug)?.id : null,
        coverImageId: coverImage.id,
        seoTitle: `${item.title} | Beyond Blog Quiz`,
        seoDescription: shortSeoDescription(item.description),
        createdByAdminId: params.adminId,
        publishedAt: daysAgo(9),
      },
      create: {
        title: item.title,
        slug,
        description: item.description,
        status: QuizStatus.PUBLISHED,
        isFeatured: true,
        showAnswersAfterSubmit: true,
        allowMultipleAttempts: true,
        timeLimitMinutes: 12,
        passingScore: Math.ceil(item.questions.length * 0.7),
        contentId: item.contentSlug ? params.contentBySlug.get(item.contentSlug)?.id : null,
        courseId: item.courseSlug ? params.courses.get(item.courseSlug)?.id : null,
        coverImageId: coverImage.id,
        seoTitle: `${item.title} | Beyond Blog Quiz`,
        seoDescription: shortSeoDescription(item.description),
        createdByAdminId: params.adminId,
        publishedAt: daysAgo(9),
        createdAt: daysAgo(10),
      },
    });

    const createdQuestions = [];
    for (const [questionIndex, questionSeed] of item.questions.entries()) {
      const question = await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          questionText: questionSeed.text,
          position: (questionIndex + 1) * 10,
          questionType: QuizQuestionType.SINGLE_CHOICE,
          explanation: questionSeed.explanation,
          points: 1,
          allowMultipleSelections: false,
          options: {
            create: questionSeed.options.map((option, optionIndex) => ({
              optionText: option,
              isCorrect: optionIndex === questionSeed.correctIndex,
              position: (optionIndex + 1) * 10,
            })),
          },
        },
        include: { options: true },
      });
      createdQuestions.push(question);
    }

    const attemptCount = item.questions.length + 2;
    for (let attemptIndex = 0; attemptIndex < attemptCount; attemptIndex += 1) {
      const answerRows = createdQuestions.map((question, questionIndex) => {
        const shouldAnswerCorrectly = (attemptIndex + questionIndex) % 4 !== 0;
        const option =
          question.options.find((candidate) => candidate.isCorrect === shouldAnswerCorrectly) ??
          question.options.find((candidate) => candidate.isCorrect) ??
          question.options[0];

        return {
          questionId: question.id,
          optionId: option.id,
          isCorrect: option.isCorrect,
        };
      });

      const score = answerRows.filter((answer) => answer.isCorrect).length;
      await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          guestName: ["Riya", "Alex", "Meera", "Ben", "Sofia", "Dev", "Hana", "Chris"][attemptIndex % 8],
          guestEmail: `demo.quiz.${slug}.${attemptIndex}@example.com`,
          visitorTokenHash: hash(`demo-quiz-${slug}-${attemptIndex}`),
          startedAt: daysAgo(7 - (attemptIndex % 5), 10),
          submittedAt: daysAgo(7 - (attemptIndex % 5), 10 + (attemptIndex % 3)),
          score,
          totalPoints: createdQuestions.length,
          passed: score >= Math.ceil(createdQuestions.length * 0.7),
          timeSpentSeconds: 180 + attemptIndex * 37,
          answers: {
            createMany: {
              data: answerRows.map((answer) => ({
                questionId: answer.questionId,
                optionId: answer.optionId,
              })),
            },
          },
        },
      });
    }
  }
}

async function seedAdminProfile(adminId: string, profileImageId: string) {
  await prisma.adminProfile.upsert({
    where: { singletonKey: "ADMIN_PROFILE" },
    update: {
      adminUserId: adminId,
      fullName: "Maya Rao",
      designation: "Founder, product engineer, and learning systems designer",
      bio:
        "Maya builds practical publishing and learning systems for independent experts. Beyond Blog is her working archive for product thinking, implementation notes, courses, and public experiments.",
      address: "Bengaluru, India",
      email: process.env.SINGLE_ADMIN_EMAIL ?? "admin@beyondblog.dev",
      phone: null,
      jobs:
        "Founder at Beyond Blog\nFormer product engineering lead for editorial and education products\nAdvisor to small teams building content-led software",
      education:
        "M.S. Human-Computer Interaction\nB.Tech Computer Science\nContinuing research in learning design and creator tooling",
      profileImageId,
      linkedinUrl: "https://www.linkedin.com/in/mayarao-demo",
      githubUrl: "https://github.com/beyondblog-demo",
      twitterUrl: null,
      websiteUrl: "https://beyondblog.example.com",
      copyrightText: `© ${new Date().getFullYear()} Beyond Blog. Built for thoughtful public learning.`,
    },
    create: {
      singletonKey: "ADMIN_PROFILE",
      adminUserId: adminId,
      fullName: "Maya Rao",
      designation: "Founder, product engineer, and learning systems designer",
      bio:
        "Maya builds practical publishing and learning systems for independent experts. Beyond Blog is her working archive for product thinking, implementation notes, courses, and public experiments.",
      address: "Bengaluru, India",
      email: process.env.SINGLE_ADMIN_EMAIL ?? "admin@beyondblog.dev",
      phone: null,
      jobs:
        "Founder at Beyond Blog\nFormer product engineering lead for editorial and education products\nAdvisor to small teams building content-led software",
      education:
        "M.S. Human-Computer Interaction\nB.Tech Computer Science\nContinuing research in learning design and creator tooling",
      profileImageId,
      linkedinUrl: "https://www.linkedin.com/in/mayarao-demo",
      githubUrl: "https://github.com/beyondblog-demo",
      twitterUrl: null,
      websiteUrl: "https://beyondblog.example.com",
      copyrightText: `© ${new Date().getFullYear()} Beyond Blog. Built for thoughtful public learning.`,
    },
  });
}

async function seedSiteSettings() {
  await prisma.siteSetting.upsert({
    where: { singletonKey: "SITE_SETTINGS" },
    update: {
      siteTitle: "Beyond Blog",
      siteSubtitle: "Research, projects, insights, and public learning",
      homepageHeroText:
        "Beyond Blog is a polished demo archive for journals, articles, projects, media, quizzes, and courses built around one focused admin workflow.",
      contactEmail: process.env.SINGLE_ADMIN_EMAIL ?? "admin@beyondblog.dev",
      socialLinks: {
        github: "https://github.com/beyondblog-demo",
        linkedin: "https://www.linkedin.com/in/mayarao-demo",
        website: "https://beyondblog.example.com",
      },
      commentModerationEnabled: true,
      defaultQuizShowAnswersAfterSubmit: true,
      defaultQuizAllowMultipleAttempts: true,
      defaultQuizTimeLimitSeconds: 720,
      defaultQuizPassingScore: 70,
    },
    create: {
      singletonKey: "SITE_SETTINGS",
      siteTitle: "Beyond Blog",
      siteSubtitle: "Research, projects, insights, and public learning",
      homepageHeroText:
        "Beyond Blog is a polished demo archive for journals, articles, projects, media, quizzes, and courses built around one focused admin workflow.",
      contactEmail: process.env.SINGLE_ADMIN_EMAIL ?? "admin@beyondblog.dev",
      socialLinks: {
        github: "https://github.com/beyondblog-demo",
        linkedin: "https://www.linkedin.com/in/mayarao-demo",
        website: "https://beyondblog.example.com",
      },
      commentModerationEnabled: true,
      defaultQuizShowAnswersAfterSubmit: true,
      defaultQuizAllowMultipleAttempts: true,
      defaultQuizTimeLimitSeconds: 720,
      defaultQuizPassingScore: 70,
    },
  });
}

async function main() {
  const ownerAdmin = await seedAdmin();
  const media = await seedMedia(ownerAdmin.id);
  const { categories, tags } = await seedTaxonomy();
  const contentBySlug = await seedContent({
    adminId: ownerAdmin.id,
    media,
    categories,
    tags,
  });
  const courses = await seedCourses({
    adminId: ownerAdmin.id,
    media,
  });

  await seedComments(contentBySlug);
  await seedLikes(contentBySlug);
  await seedQuizzes({
    adminId: ownerAdmin.id,
    media,
    contentBySlug,
    courses,
  });

  const profileImage = media.get("demo-uploadthing-image-profile-portrait");
  if (!profileImage) {
    throw new Error("Missing profile image media seed.");
  }

  await seedAdminProfile(ownerAdmin.id, profileImage.id);
  await seedSiteSettings();

  console.log("Seed completed:");
  console.log(`- ${media.size} media assets`);
  console.log(`- ${categories.size} categories and ${tags.size} tags`);
  console.log(`- ${contentBySlug.size} content items`);
  console.log(`- ${courses.size} courses with sections and lessons`);
  console.log(`- ${quizSeeds.length} quizzes with attempts`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
