import Image from "next/image";
import { FileIcon } from "lucide-react";
import { MEDIA_TYPE, type MediaType } from "@/lib/content/enums";
import { formatFileSize, getMediaTypeLabel } from "@/lib/media/utils";

type MediaPreviewProps = {
  media: {
    id: string;
    type: MediaType;
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
    title: string | null;
    originalFilename: string | null;
    mimeType: string;
    sizeBytes: number;
  } | null;
  compact?: boolean;
};

export function MediaPreview({ media, compact = false }: MediaPreviewProps) {
  if (!media) {
    return (
      <div className="surface-inset flex items-center gap-3 p-3">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <FileIcon className="size-4" />
        </span>
        <div className="text-sm text-muted-foreground">No media selected</div>
      </div>
    );
  }

  const label = getMediaTypeLabel(media.type);
  const imageUrl = media.thumbnailUrl ?? media.url;

  return (
    <div className="surface-inset flex items-center gap-3 p-3">
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted">
        {media.type === MEDIA_TYPE.IMAGE ? (
          <Image
            src={imageUrl}
            alt={media.altText ?? media.title ?? "Media preview"}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground uppercase">
            {label}
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium">
          {media.title ?? media.originalFilename ?? "Untitled media"}
        </p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        {!compact ? (
          <p className="truncate text-xs text-muted-foreground">
            {media.mimeType} - {formatFileSize(media.sizeBytes)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
