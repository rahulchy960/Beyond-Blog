import dynamic from "next/dynamic";
import { EditorPageSkeleton } from "@/components/ui/loading-skeletons";

const CourseEditorForm = dynamic(
  () => import("@/components/course/course-editor-form").then((mod) => mod.CourseEditorForm),
  { loading: () => <EditorPageSkeleton /> },
);

type EditCoursePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { id } = await params;
  return <CourseEditorForm mode="edit" courseId={id} />;
}

