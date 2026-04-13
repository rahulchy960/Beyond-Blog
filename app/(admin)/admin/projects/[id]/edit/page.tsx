import { CONTENT_TYPE } from "@/lib/content/enums";
import dynamic from "next/dynamic";
import { EditorPageSkeleton } from "@/components/ui/loading-skeletons";

const ContentEditorForm = dynamic(
  () => import("@/components/content/content-editor-form").then((mod) => mod.ContentEditorForm),
  { loading: () => <EditorPageSkeleton /> },
);

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  return <ContentEditorForm mode="edit" type={CONTENT_TYPE.PROJECT} contentId={id} />;
}
