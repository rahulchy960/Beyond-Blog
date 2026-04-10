import { notFound } from "next/navigation";
import { SiteContainer } from "@/components/layout/site-container";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PublicCourseDetail } from "@/components/course/public-course-detail";
import { getServerCaller } from "@/server/api/caller";

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const caller = await getServerCaller();
  let course: Awaited<ReturnType<typeof caller.course.getPublishedBySlug>>;

  try {
    course = await caller.course.getPublishedBySlug({ slug });
  } catch {
    notFound();
  }

  return (
    <SiteContainer>
      <AnimatedPageWrapper>
        <PublicCourseDetail course={course} />
      </AnimatedPageWrapper>
    </SiteContainer>
  );
}

