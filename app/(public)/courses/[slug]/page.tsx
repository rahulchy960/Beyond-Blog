import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteContainer } from "@/components/layout/site-container";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PublicCourseDetail } from "@/components/course/public-course-detail";
import { buildPageMetadata, getSeoSettings } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema, buildCourseSchema } from "@/lib/seo/structured-data";
import { getPublicServerCaller } from "@/server/api/caller";
import { type DiscoveryResultItem } from "@/types/discovery";

export const revalidate = 300;

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caller = await getPublicServerCaller();

  try {
    const course = await caller.course.getPublishedBySlug({ slug });
    return buildPageMetadata({
      path: `/courses/${course.slug}`,
      title: course.seoTitle ?? course.title,
      description: course.seoDescription ?? course.summary,
      imageUrl: course.coverImage?.url ?? null,
      ogType: "article",
    });
  } catch {
    return buildPageMetadata({
      path: `/courses/${slug}`,
      title: "Course",
      description: "Course page on Beyond Blog.",
      noIndex: true,
      ogType: "website",
    });
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const caller = await getPublicServerCaller();
  let course: Awaited<ReturnType<typeof caller.course.getPublishedBySlug>>;
  let relatedItems: DiscoveryResultItem[] = [];

  try {
    [course, relatedItems] = await Promise.all([
      caller.course.getPublishedBySlug({ slug }),
      caller.discovery
        .relatedByTarget({
          targetType: "COURSE",
          slug,
          limit: 4,
        })
        .then((result) => result.items),
    ]);
  } catch {
    notFound();
  }

  const seo = await getSeoSettings();
  const courseSchema = buildCourseSchema({
    seo,
    title: course.title,
    description: course.summary ?? course.seoDescription,
    path: `/courses/${course.slug}`,
    imageUrl: course.coverImage?.url ?? null,
  });
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", path: "/" },
      { name: "Courses", path: "/courses" },
      { name: course.title, path: `/courses/${course.slug}` },
    ],
    seo,
  );

  return (
    <SiteContainer>
      <JsonLdScript data={[courseSchema, breadcrumbSchema]} />
      <AnimatedPageWrapper>
        <PublicCourseDetail course={course} relatedItems={relatedItems} />
      </AnimatedPageWrapper>
    </SiteContainer>
  );
}

