import { CONTENT_TYPE } from "@/lib/content/enums";
import { ContentEditorForm } from "@/components/content/content-editor-form";

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  return <ContentEditorForm mode="edit" type={CONTENT_TYPE.ARTICLE} contentId={id} />;
}
