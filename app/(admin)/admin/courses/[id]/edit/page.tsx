import { CourseEditorForm } from "@/components/course/course-editor-form";

type EditCoursePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { id } = await params;
  return <CourseEditorForm mode="edit" courseId={id} />;
}

