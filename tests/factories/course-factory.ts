import { COURSE_STATUS } from "@/lib/content/enums";

let courseCounter = 1;

export function courseFactory(overrides: Partial<{
  id: string;
  title: string;
  slug: string;
  status: typeof COURSE_STATUS[keyof typeof COURSE_STATUS];
}> = {}) {
  const index = courseCounter++;
  return {
    id: overrides.id ?? `course_${index}`,
    title: overrides.title ?? `Course ${index}`,
    slug: overrides.slug ?? `course-${index}`,
    status: overrides.status ?? COURSE_STATUS.PUBLISHED,
  };
}
