import { type DiscoveryResultType } from "@/types/discovery";

export const discoveryTypeMeta: Record<
  DiscoveryResultType,
  { label: string; plural: string; href: string }
> = {
  JOURNAL: { label: "Journal", plural: "Journals", href: "/journals" },
  ARTICLE: { label: "Article", plural: "Articles", href: "/articles" },
  PROJECT: { label: "Project", plural: "Projects", href: "/projects" },
  COURSE: { label: "Course", plural: "Courses", href: "/courses" },
  QUIZ: { label: "Quiz", plural: "Quizzes", href: "/quizzes" },
};

export const discoveryScopeOptions = [
  { value: "ALL", label: "All types" },
  { value: "JOURNAL", label: "Journals" },
  { value: "ARTICLE", label: "Articles" },
  { value: "PROJECT", label: "Projects" },
  { value: "COURSE", label: "Courses" },
  { value: "QUIZ", label: "Quizzes" },
] as const;

