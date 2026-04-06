import { format } from "date-fns";
import Link from "next/link";
import { type ContentType } from "@/lib/content/enums";
import { contentTypeMeta } from "@/lib/content/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PublicContentListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
  tags: Array<{ tag: { name: string; slug: string } }>;
};

type PublicContentListProps = {
  type: ContentType;
  items: PublicContentListItem[];
};

export function PublicContentList({ type, items }: PublicContentListProps) {
  const meta = contentTypeMeta[type];

  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">{meta.plural}</h1>
        <p className="mt-2 text-muted-foreground">
          Published {meta.plural.toLowerCase()} from Beyond Blog.
        </p>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="bg-card/80">
            <CardHeader className="space-y-2">
              <CardTitle>
                <Link href={`${meta.publicBasePath}/${item.slug}`} className="hover:underline">
                  {item.title}
                </Link>
              </CardTitle>
              <CardDescription>
                {item.publishedAt ? format(item.publishedAt, "MMMM d, yyyy") : "Unpublished"}
                {item.category ? ` • ${item.category.name}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.summary ? (
                <p className="text-sm text-muted-foreground">{item.summary}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge key={tag.tag.slug} variant="secondary">
                    {tag.tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
