"use client";

import { motion } from "motion/react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContentType } from "@/lib/content/enums";
import { contentTypeMeta } from "@/lib/content/constants";

type FeaturedContentCardProps = {
  type: ContentType;
  item: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    publishedAt: Date | string | null;
    category: { name: string; slug: string } | null;
    coverImage: { url: string; altText: string | null } | null;
    tags: Array<{ tag: { name: string; slug: string } }>;
  };
};

export function FeaturedContentCard({ type, item }: FeaturedContentCardProps) {
  const meta = contentTypeMeta[type];
  const href = `${meta.publicBasePath}/${item.slug}`;
  const publishedAt = item.publishedAt ? new Date(item.publishedAt) : null;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.24, ease: "easeOut" }}>
      <Card className="surface-panel-strong overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative min-h-64 border-b border-border/70 lg:min-h-[23rem] lg:border-r lg:border-b-0">
            {item.coverImage ? (
              <Image
                src={item.coverImage.url}
                alt={item.coverImage.altText ?? item.title}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <CardHeader className="space-y-4">
              <CardDescription className="text-[0.68rem] tracking-[0.16em] uppercase">
                Featured {meta.singular}
              </CardDescription>
              <CardTitle className="text-3xl leading-tight tracking-tight">
                <Link href={href} className="inline-flex items-start gap-1 hover:text-primary">
                  <span>{item.title}</span>
                  <ArrowUpRightIcon className="mt-1 size-4 shrink-0" />
                </Link>
              </CardTitle>
              <CardDescription className="text-[0.82rem]">
                {publishedAt ? format(publishedAt, "MMMM d, yyyy") : "Unpublished"}
                {item.category ? ` - ${item.category.name}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              {item.summary ? <p className="text-sm leading-7 text-muted-foreground">{item.summary}</p> : null}
              {item.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.tags.slice(0, 5).map((tag) => (
                    <Badge key={tag.tag.slug} variant="secondary">
                      {tag.tag.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
