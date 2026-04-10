import { FileTextIcon } from "lucide-react";
import { PublicCourseCard } from "@/components/course/public-course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";

type PublicCourseListProps = {
  items: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    difficultyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
    estimatedDurationMinutes: number | null;
    isFeatured: boolean;
    coverImage: {
      id: string;
      url: string;
      thumbnailUrl: string | null;
      altText: string | null;
    } | null;
    _count: {
      lessons: number;
      sections: number;
    };
  }>;
};

export function PublicCourseList({ items }: PublicCourseListProps) {
  return (
    <section className="space-y-7">
      <SectionHeader
        eyebrow="Beyond Blog"
        title="Courses"
        description="Structured multi-lesson learning paths authored by the Beyond Blog admin."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title="No published courses yet"
          description="Courses will appear here once they are published from the admin workspace."
        />
      ) : (
        <div className="grid gap-4">
          {items.map((course) => (
            <PublicCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </section>
  );
}

