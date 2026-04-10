import {
  COURSE_DIFFICULTY_LEVEL,
  COURSE_LESSON_ITEM_TYPE,
  COURSE_STATUS,
  type CourseDifficultyLevel,
  type CourseLessonItemType,
  type CourseStatus,
} from "@/lib/content/enums";

export const courseStatusLabels: Record<CourseStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const courseStatusOptions = [
  { label: "Draft", value: COURSE_STATUS.DRAFT },
  { label: "Published", value: COURSE_STATUS.PUBLISHED },
  { label: "Archived", value: COURSE_STATUS.ARCHIVED },
] as const;

export const courseDifficultyLabels: Record<CourseDifficultyLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const courseDifficultyOptions = [
  { label: "Beginner", value: COURSE_DIFFICULTY_LEVEL.BEGINNER },
  { label: "Intermediate", value: COURSE_DIFFICULTY_LEVEL.INTERMEDIATE },
  { label: "Advanced", value: COURSE_DIFFICULTY_LEVEL.ADVANCED },
] as const;

export const courseLessonTypeLabels: Record<CourseLessonItemType, string> = {
  RICH_TEXT: "Rich text",
  VIDEO: "Video",
  IMAGE: "Image",
  RESOURCE: "Resource",
};

export const courseLessonTypeOptions = [
  { label: "Rich text lesson", value: COURSE_LESSON_ITEM_TYPE.RICH_TEXT },
  { label: "Video lesson", value: COURSE_LESSON_ITEM_TYPE.VIDEO },
  { label: "Image lesson", value: COURSE_LESSON_ITEM_TYPE.IMAGE },
  { label: "Resource item", value: COURSE_LESSON_ITEM_TYPE.RESOURCE },
] as const;

export const courseAdminBasePath = "/admin/courses";
export const coursePublicBasePath = "/courses";

