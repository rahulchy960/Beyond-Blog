import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { SiteContainer } from "@/components/layout/site-container";
import { PublicCourseList } from "@/components/course/public-course-list";
import { getServerCaller } from "@/server/api/caller";

export default async function CoursesPage() {
  const caller = await getServerCaller();
  const items = await caller.course.listPublished({ limit: 40 });

  return (
    <div className="py-10 md:py-14">
      <SiteContainer>
        <AnimatedPageWrapper>
          <PublicCourseList items={items} />
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}

