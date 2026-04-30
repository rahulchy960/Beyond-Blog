import { CONTENT_TYPE, PUBLISH_STATUS } from "@/lib/content/enums";

let contentCounter = 1;

export function contentFactory(overrides: Partial<{
  id: string;
  title: string;
  slug: string;
  type: typeof CONTENT_TYPE[keyof typeof CONTENT_TYPE];
  publishStatus: typeof PUBLISH_STATUS[keyof typeof PUBLISH_STATUS];
  summary: string | null;
}> = {}) {
  const index = contentCounter++;
  return {
    id: overrides.id ?? `content_${index}`,
    title: overrides.title ?? `Content ${index}`,
    slug: overrides.slug ?? `content-${index}`,
    type: overrides.type ?? CONTENT_TYPE.ARTICLE,
    publishStatus: overrides.publishStatus ?? PUBLISH_STATUS.PUBLISHED,
    summary: overrides.summary ?? `Summary ${index}`,
  };
}
