import type {
  Comment,
  Content,
  ContentLike,
  Course,
  CourseLesson,
  MediaAsset,
  Quiz,
  QuizQuestion,
} from "@prisma/client";

export type ContentType = Content["type"];
export type PublishStatus = Content["publishStatus"];
export type MediaType = MediaAsset["type"];
export type CourseStatus = Course["status"];
export type CourseLessonItemType = CourseLesson["itemType"];
export type CourseDifficultyLevel = Exclude<Course["difficultyLevel"], null>;
export type QuizStatus = Quiz["status"];
export type QuizQuestionType = QuizQuestion["questionType"];
export type CommentStatus = Comment["status"];
export type InteractionTargetType = ContentLike["targetType"];

export const CONTENT_TYPE: Record<ContentType, ContentType> = {
  JOURNAL: "JOURNAL",
  ARTICLE: "ARTICLE",
  PROJECT: "PROJECT",
};

export const PUBLISH_STATUS: Record<PublishStatus, PublishStatus> = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
};

export const MEDIA_TYPE: Record<MediaType, MediaType> = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  FILE: "FILE",
};

export const COURSE_STATUS: Record<CourseStatus, CourseStatus> = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
};

export const COURSE_LESSON_ITEM_TYPE: Record<CourseLessonItemType, CourseLessonItemType> = {
  RICH_TEXT: "RICH_TEXT",
  VIDEO: "VIDEO",
  IMAGE: "IMAGE",
  RESOURCE: "RESOURCE",
};

export const COURSE_DIFFICULTY_LEVEL: Record<CourseDifficultyLevel, CourseDifficultyLevel> = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
};

export const QUIZ_STATUS: Record<QuizStatus, QuizStatus> = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  CLOSED: "CLOSED",
};

export const QUIZ_QUESTION_TYPE: Record<QuizQuestionType, QuizQuestionType> = {
  SINGLE_CHOICE: "SINGLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
};

export const COMMENT_STATUS: Record<CommentStatus, CommentStatus> = {
  PENDING: "PENDING",
  VISIBLE: "VISIBLE",
  HIDDEN: "HIDDEN",
  DELETED: "DELETED",
};

export const INTERACTION_TARGET_TYPE: Record<InteractionTargetType, InteractionTargetType> = {
  CONTENT: "CONTENT",
  COURSE: "COURSE",
  COURSE_LESSON: "COURSE_LESSON",
};

export const CONTENT_TYPES = [
  CONTENT_TYPE.JOURNAL,
  CONTENT_TYPE.ARTICLE,
  CONTENT_TYPE.PROJECT,
] as const;

export const PUBLISH_STATUSES = [
  PUBLISH_STATUS.DRAFT,
  PUBLISH_STATUS.PUBLISHED,
  PUBLISH_STATUS.ARCHIVED,
] as const;

export const MEDIA_TYPES = [
  MEDIA_TYPE.IMAGE,
  MEDIA_TYPE.VIDEO,
  MEDIA_TYPE.FILE,
] as const;

export const COURSE_STATUSES = [
  COURSE_STATUS.DRAFT,
  COURSE_STATUS.PUBLISHED,
  COURSE_STATUS.ARCHIVED,
] as const;

export const COURSE_LESSON_ITEM_TYPES = [
  COURSE_LESSON_ITEM_TYPE.RICH_TEXT,
  COURSE_LESSON_ITEM_TYPE.VIDEO,
  COURSE_LESSON_ITEM_TYPE.IMAGE,
  COURSE_LESSON_ITEM_TYPE.RESOURCE,
] as const;

export const COURSE_DIFFICULTY_LEVELS = [
  COURSE_DIFFICULTY_LEVEL.BEGINNER,
  COURSE_DIFFICULTY_LEVEL.INTERMEDIATE,
  COURSE_DIFFICULTY_LEVEL.ADVANCED,
] as const;

export const QUIZ_STATUSES = [
  QUIZ_STATUS.DRAFT,
  QUIZ_STATUS.PUBLISHED,
  QUIZ_STATUS.CLOSED,
] as const;

export const QUIZ_QUESTION_TYPES = [
  QUIZ_QUESTION_TYPE.SINGLE_CHOICE,
  QUIZ_QUESTION_TYPE.MULTIPLE_CHOICE,
] as const;

export const COMMENT_STATUSES = [
  COMMENT_STATUS.PENDING,
  COMMENT_STATUS.VISIBLE,
  COMMENT_STATUS.HIDDEN,
  COMMENT_STATUS.DELETED,
] as const;

export const INTERACTION_TARGET_TYPES = [
  INTERACTION_TARGET_TYPE.CONTENT,
  INTERACTION_TARGET_TYPE.COURSE,
  INTERACTION_TARGET_TYPE.COURSE_LESSON,
] as const;

