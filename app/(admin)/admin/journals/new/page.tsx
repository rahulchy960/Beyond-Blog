import { CONTENT_TYPE } from "@/lib/content/enums";
import dynamic from "next/dynamic";
import { EditorPageSkeleton } from "@/components/ui/loading-skeletons";

const ContentEditorForm = dynamic(
  () => import("@/components/content/content-editor-form").then((mod) => mod.ContentEditorForm),
  { loading: () => <EditorPageSkeleton /> },
);

export default function NewJournalPage() {
  return <ContentEditorForm mode="create" type={CONTENT_TYPE.JOURNAL} />;
}
