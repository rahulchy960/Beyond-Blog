import { CONTENT_TYPE } from "@/lib/content/enums";
import { ContentEditorForm } from "@/components/content/content-editor-form";

export default function NewArticlePage() {
  return <ContentEditorForm mode="create" type={CONTENT_TYPE.ARTICLE} />;
}
