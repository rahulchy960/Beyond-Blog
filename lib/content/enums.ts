import type { Content, MediaAsset } from "@prisma/client";

export type ContentType = Content["type"];
export type PublishStatus = Content["publishStatus"];
export type MediaType = MediaAsset["type"];

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
