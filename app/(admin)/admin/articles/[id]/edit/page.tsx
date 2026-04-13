import { CONTENT_TYPE } from "@/lib/content/enums";
import dynamic from "next/dynamic";
import { EditorPageSkeleton } from "@/components/ui/loading-skeletons";

const ContentEditorForm = dynamic(
  () => import("@/components/content/content-editor-form").then((mod) => mod.ContentEditorForm),
  { loading: () => <EditorPageSkeleton /> },
);

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  return <ContentEditorForm mode="edit" type={CONTENT_TYPE.ARTICLE} contentId={id} />;
}
