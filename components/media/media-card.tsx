"use client";

import { format } from "date-fns";
import Image from "next/image";
import { motion } from "motion/react";
import { FileIcon, FilmIcon, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MEDIA_TYPE, type MediaType } from "@/lib/content/enums";
import { formatFileSize, getMediaTypeLabel } from "@/lib/media/utils";
import { MediaActionsMenu } from "@/components/media/media-actions-menu";

type MediaCardProps = {
  media: {
    id: string;
    type: MediaType;
    title: string | null;
    originalFilename: string | null;
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
    createdAt: Date | string;
    contentId: string | null;
    storageProvider: string | null;
    externalUrl: string | null;
    playbackUrl: string | null;
    caption: string | null;
    providerAssetId: string | null;
  };
  onSelect?: (mediaId: string) => void;
};

function renderMediaTypeIcon(type: MediaType) {
  switch (type) {
    case MEDIA_TYPE.IMAGE:
      return <ImageIcon className="size-6" />;
    case MEDIA_TYPE.VIDEO:
      return <FilmIcon className="size-6" />;
    default:
      return <FileIcon className="size-6" />;
  }
}

export function MediaCard({ media, onSelect }: MediaCardProps) {
  const typeLabel = getMediaTypeLabel(media.type);
  const imageUrl = media.thumbnailUrl ?? media.url;
  const createdAt = new Date(media.createdAt);

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.18, ease: "easeOut" }}>
      <Card className="surface-panel overflow-hidden">
        <div className="relative h-44 border-b border-border/70 bg-muted">
          {media.type === MEDIA_TYPE.IMAGE ? (
            <Image
              src={imageUrl}
              alt={media.altText ?? media.title ?? "Media asset"}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {renderMediaTypeIcon(media.type)}
            </div>
          )}
        </div>
        <CardHeader className="space-y-2 pb-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-medium">
                {media.title ?? media.originalFilename ?? "Untitled"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{media.originalFilename ?? media.mimeType}</p>
            </div>
            <MediaActionsMenu media={media} onSelect={onSelect} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{typeLabel}</Badge>
            {media.contentId ? <Badge variant="outline">Attached</Badge> : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(media.sizeBytes)} - {format(createdAt, "MMM d, yyyy")}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
