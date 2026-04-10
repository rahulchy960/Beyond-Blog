import {
  COMMENT_STATUS,
  INTERACTION_TARGET_TYPE,
  type CommentStatus,
  type ContentType,
  type InteractionTargetType,
} from "@/lib/content/enums";
import { contentTypeMeta } from "@/lib/content/constants";

export const interactionTargetLabels: Record<InteractionTargetType, string> = {
  CONTENT: "Publication",
  COURSE: "Course",
  COURSE_LESSON: "Lesson",
};

export const interactionTargetOptions = [
  { label: "All targets", value: "all" },
  { label: interactionTargetLabels[INTERACTION_TARGET_TYPE.CONTENT], value: INTERACTION_TARGET_TYPE.CONTENT },
  { label: interactionTargetLabels[INTERACTION_TARGET_TYPE.COURSE], value: INTERACTION_TARGET_TYPE.COURSE },
  {
    label: interactionTargetLabels[INTERACTION_TARGET_TYPE.COURSE_LESSON],
    value: INTERACTION_TARGET_TYPE.COURSE_LESSON,
  },
] as const;

export const commentStatusLabels: Record<CommentStatus, string> = {
  PENDING: "Pending",
  VISIBLE: "Visible",
  HIDDEN: "Hidden",
  DELETED: "Deleted",
};

export const commentStatusOptions = [
  { label: "All statuses", value: "all" },
  { label: commentStatusLabels[COMMENT_STATUS.PENDING], value: COMMENT_STATUS.PENDING },
  { label: commentStatusLabels[COMMENT_STATUS.VISIBLE], value: COMMENT_STATUS.VISIBLE },
  { label: commentStatusLabels[COMMENT_STATUS.HIDDEN], value: COMMENT_STATUS.HIDDEN },
  { label: commentStatusLabels[COMMENT_STATUS.DELETED], value: COMMENT_STATUS.DELETED },
] as const;

export function getContentPublicPath(type: ContentType, slug: string) {
  return `${contentTypeMeta[type].publicBasePath}/${slug}`;
}
