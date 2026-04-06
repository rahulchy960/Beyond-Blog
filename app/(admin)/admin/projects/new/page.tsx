import { CONTENT_TYPE } from "@/lib/content/enums";
import { ContentEditorForm } from "@/components/content/content-editor-form";

export default function NewProjectPage() {
  return <ContentEditorForm mode="create" type={CONTENT_TYPE.PROJECT} />;
}
