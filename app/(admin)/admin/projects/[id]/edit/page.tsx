import { CONTENT_TYPE } from "@/lib/content/enums";
import { ContentEditorForm } from "@/components/content/content-editor-form";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  return <ContentEditorForm mode="edit" type={CONTENT_TYPE.PROJECT} contentId={id} />;
}
