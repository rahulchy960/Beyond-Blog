import { CONTENT_TYPE, type ContentType } from "@/lib/content/enums";

export function getContentTypeLabel(type: ContentType) {
  if (type === CONTENT_TYPE.JOURNAL) return "Journal";
  if (type === CONTENT_TYPE.ARTICLE) return "Article";
  return "Project";
}

export function getContentTypeLabelPlural(type: ContentType) {
  if (type === CONTENT_TYPE.JOURNAL) return "Journals";
  if (type === CONTENT_TYPE.ARTICLE) return "Articles";
  return "Projects";
}

export function getContentTypePublicPath(type: ContentType) {
  if (type === CONTENT_TYPE.JOURNAL) return "/journals";
  if (type === CONTENT_TYPE.ARTICLE) return "/articles";
  return "/projects";
}
