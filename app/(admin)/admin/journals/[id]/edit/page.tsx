import { CONTENT_TYPE } from "@/lib/content/enums";
import { ContentEditorForm } from "@/components/content/content-editor-form";

type EditJournalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditJournalPage({ params }: EditJournalPageProps) {
  const { id } = await params;
  return <ContentEditorForm mode="edit" type={CONTENT_TYPE.JOURNAL} contentId={id} />;
}
