import {
  PUBLISH_STATUS,
  type ContentType,
  type PublishStatus,
} from "@/lib/content/enums";

export const contentTypeMeta: Record<
  ContentType,
  {
    singular: string;
    plural: string;
    adminBasePath: string;
    publicBasePath: string;
  }
> = {
  JOURNAL: {
    singular: "Journal",
    plural: "Journals",
    adminBasePath: "/admin/journals",
    publicBasePath: "/journals",
  },
  ARTICLE: {
    singular: "Article",
    plural: "Articles",
    adminBasePath: "/admin/articles",
    publicBasePath: "/articles",
  },
  PROJECT: {
    singular: "Project",
    plural: "Projects",
    adminBasePath: "/admin/projects",
    publicBasePath: "/projects",
  },
};

export const publishStatusLabels: Record<PublishStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const publishStatusOptions = [
  {
    label: "Draft",
    value: PUBLISH_STATUS.DRAFT,
  },
  {
    label: "Published",
    value: PUBLISH_STATUS.PUBLISHED,
  },
  {
    label: "Archived",
    value: PUBLISH_STATUS.ARCHIVED,
  },
] as const;
