"use client";

import { motion } from "motion/react";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentType } from "@/lib/content/enums";
import { contentTypeMeta } from "@/lib/content/constants";

type ContentCardProps = {
  type: ContentType;
  item: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    publishedAt: Date | string | null;
    category: { name: string; slug: string } | null;
    tags: Array<{ tag: { name: string; slug: string } }>;
  };
};

export function ContentCard({ type, item }: ContentCardProps) {
  const meta = contentTypeMeta[type];
  const href = `${meta.publicBasePath}/${item.slug}`;
  const publishedAt = item.publishedAt ? new Date(item.publishedAt) : null;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <Card className="surface-panel h-full">
          <CardHeader className="space-y-3 border-b border-border/70 pb-4">
            <CardDescription className="text-[0.68rem] tracking-[0.14em] uppercase">
              {publishedAt ? format(publishedAt, "MMMM d, yyyy") : "Unpublished"}
              {item.category ? " - " : ""}
              {item.category ? (
                <Link href={`/categories/${item.category.slug}`} className="hover:text-foreground">
                  {item.category.name}
                </Link>
              ) : null}
            </CardDescription>
          <CardTitle className="text-[1.55rem] leading-[1.3] tracking-tight">
            <Link href={href} className="inline-flex items-start gap-1 hover:text-primary">
              <span>{item.title}</span>
              <ArrowUpRightIcon className="mt-1 size-4 shrink-0" />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {item.summary ? <p className="text-sm leading-7 text-muted-foreground">{item.summary}</p> : null}
          {item.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {item.tags.slice(0, 4).map((tag) => (
                <Link key={tag.tag.slug} href={`/tags/${tag.tag.slug}`}>
                  <Badge variant="secondary">
                    {tag.tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
