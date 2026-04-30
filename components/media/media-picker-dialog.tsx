"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, SearchIcon } from "lucide-react";
import { useTRPC } from "@/hooks/use-trpc";
import { MediaLibraryGrid } from "@/components/media/media-library-grid";
import { MediaPreview } from "@/components/media/media-preview";
import { MediaUploadDropzone } from "@/components/media/media-upload-dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { type MediaType } from "@/lib/content/enums";

export type MediaPickerAsset = {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  title: string | null;
  originalFilename: string | null;
  mimeType: string;
  sizeBytes: number;
};

type MediaPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMediaId?: string | null;
  onSelect: (media: MediaPickerAsset) => void;
  types?: MediaType[];
  title?: string;
  description?: string;
  showUploadArea?: boolean;
};

export function MediaPickerDialog({
  open,
  onOpenChange,
  selectedMediaId,
  onSelect,
  types,
  title = "Select media",
  description = "Browse existing uploads and reuse media assets.",
  showUploadArea = true,
}: MediaPickerDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [localSelectedMediaId, setLocalSelectedMediaId] = useState<string | null>(null);

  const mediaQuery = useQuery(
    trpc.media.listForPicker.queryOptions({
      query: query || undefined,
      limit: 30,
      types,
    }),
  );

  const refreshMedia = async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.media.pathKey() });
    await queryClient.refetchQueries({ queryKey: trpc.media.pathKey(), type: "active" });
  };

  const pickerItems = useMemo(() => mediaQuery.data ?? [], [mediaQuery.data]);
  const activeSelectedMediaId = localSelectedMediaId ?? selectedMediaId ?? null;
  const selectedMedia = useMemo<MediaPickerAsset | null>(() => {
    const existing = pickerItems.find((item) => item.id === activeSelectedMediaId);
    if (!existing) {
      return null;
    }

    return {
      id: existing.id,
      type: existing.type,
      url: existing.url,
      thumbnailUrl: existing.thumbnailUrl,
      altText: existing.altText,
      title: existing.title,
      originalFilename: existing.originalFilename,
      mimeType: existing.mimeType,
      sizeBytes: existing.sizeBytes,
    };
  }, [activeSelectedMediaId, pickerItems]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setLocalSelectedMediaId(null);
    }

    onOpenChange(nextOpen);
  };

  const confirmSelection = () => {
    if (!selectedMedia) {
      return;
    }

    onSelect(selectedMedia);
    setLocalSelectedMediaId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[min(1100px,calc(100vw-2rem))] max-w-none overflow-hidden p-0">
        <DialogHeader className="border-b border-border/70 px-5 py-4 sm:px-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 max-h-[calc(100dvh-9rem)] gap-0 md:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-h-0 space-y-3 overflow-y-auto p-5 sm:p-6">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, filename, or alt text"
                className="pl-10"
              />
            </div>

            {mediaQuery.isPending ? (
              <TableSkeleton rows={5} />
            ) : (
              <MediaLibraryGrid
                items={pickerItems}
                selectedMediaId={activeSelectedMediaId}
                onSelect={(mediaId) => {
                  const selected = pickerItems.find((item) => item.id === mediaId);
                  if (!selected) {
                    return;
                  }

                  setLocalSelectedMediaId(selected.id);
                }}
              />
            )}
          </div>

          <aside className="flex min-h-0 flex-col gap-4 border-t border-border/70 bg-muted/20 p-5 md:border-t-0 md:border-l sm:p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Reuse selected media</p>
              <MediaPreview media={selectedMedia} />
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
              {showUploadArea ? (
                <>
                  <MediaUploadDropzone
                    endpoint="mediaImage"
                    label="Upload image"
                    description="PNG, JPG, WEBP, GIF up to 8MB each."
                    onUploadComplete={refreshMedia}
                  />
                  <MediaUploadDropzone
                    endpoint="mediaFile"
                    label="Upload file"
                    description="PDF, docs, sheets, and zipped resources."
                    onUploadComplete={refreshMedia}
                  />
                </>
              ) : (
                <div className="surface-panel p-4 text-sm text-muted-foreground">
                  Uploads are managed in the Media Library page.
                </div>
              )}
            </div>

            <div className="mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={confirmSelection} disabled={!selectedMedia}>
                <CheckIcon className="size-4" />
                Use selected
              </Button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
