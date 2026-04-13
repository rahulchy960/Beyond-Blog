import dynamic from "next/dynamic";
import { EditorPageSkeleton } from "@/components/ui/loading-skeletons";

const CourseEditorForm = dynamic(
  () => import("@/components/course/course-editor-form").then((mod) => mod.CourseEditorForm),
  { loading: () => <EditorPageSkeleton /> },
);

export default function NewCoursePage() {
  return <CourseEditorForm mode="create" />;
}

