import { ImageOffIcon } from "lucide-react";
import { MediaCard } from "@/components/media/media-card";
import { EmptyState } from "@/components/ui/empty-state";
import { type MediaType } from "@/lib/content/enums";

type MediaLibraryItem = {
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

type MediaLibraryGridProps = {
  items: MediaLibraryItem[];
  onSelect?: (mediaId: string) => void;
  selectedMediaId?: string | null;
};

export function MediaLibraryGrid({ items, onSelect, selectedMediaId }: MediaLibraryGridProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ImageOffIcon}
        title="No media assets found"
        description="Upload images or files to populate the media library."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
          onSelect={onSelect}
          isSelected={selectedMediaId === item.id}
        />
      ))}
    </div>
  );
}
