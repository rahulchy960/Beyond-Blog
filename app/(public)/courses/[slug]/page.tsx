import { notFound } from "next/navigation";
import { SiteContainer } from "@/components/layout/site-container";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PublicCourseDetail } from "@/components/course/public-course-detail";
import { getServerCaller } from "@/server/api/caller";
import { type DiscoveryResultItem } from "@/types/discovery";

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const caller = await getServerCaller();
  let course: Awaited<ReturnType<typeof caller.course.getPublishedBySlug>>;
  let relatedItems: DiscoveryResultItem[] = [];

  try {
    course = await caller.course.getPublishedBySlug({ slug });
    relatedItems = (await caller.discovery.relatedByTarget({
      targetType: "COURSE",
      slug,
      limit: 4,
    })).items;
  } catch {
    notFound();
  }

  return (
    <SiteContainer>
      <AnimatedPageWrapper>
        <PublicCourseDetail course={course} relatedItems={relatedItems} />
      </AnimatedPageWrapper>
    </SiteContainer>
  );
}

