export type DiscoveryResultType = "JOURNAL" | "ARTICLE" | "PROJECT" | "COURSE" | "QUIZ";

export type DiscoveryResultItem = {
  id: string;
  type: DiscoveryResultType;
  title: string;
  slug: string;
  href: string;
  summary: string | null;
  isFeatured: boolean;
  publishedAt: Date | string | null;
  coverImage: {
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
  } | null;
  category: {
    name: string;
    slug: string;
  } | null;
  tags: Array<{ name: string; slug: string }>;
  meta: {
    lessonCount?: number;
    questionCount?: number;
    difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
    attemptsCount?: number;
    sectionsCount?: number;
  };
};

