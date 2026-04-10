import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { CourseListTable } from "@/components/course/course-list-table";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/lib/ui/button-variants";

export function AdminCourseListScreen() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Courses"
        description="Build modular programming-style courses with ordered sections, lessons, and reusable media."
        actions={
          <Link href="/admin/courses/new" className={buttonVariants({ size: "sm" })}>
            <PlusIcon className="size-4" />
            New Course
          </Link>
        }
      />

      <AnimatedPageWrapper delay={0.03}>
        <CourseListTable />
      </AnimatedPageWrapper>
    </div>
  );
}

