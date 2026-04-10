"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/hooks/use-trpc";
import { MediaLibraryGrid } from "@/components/media/media-library-grid";
import { MediaUploadDropzone } from "@/components/media/media-upload-dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { type MediaType } from "@/lib/content/enums";

type MediaPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: {
    id: string;
    type: MediaType;
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
    title: string | null;
    originalFilename: string | null;
    mimeType: string;
    sizeBytes: number;
  }) => void;
  types?: MediaType[];
  title?: string;
  description?: string;
  showUploadArea?: boolean;
};

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  types,
  title = "Select media",
  description = "Browse existing uploads and reuse media assets.",
  showUploadArea = true,
}: MediaPickerDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");

  const mediaQuery = useQuery(
    trpc.media.listForPicker.queryOptions({
      query: query || undefined,
      limit: 30,
      types,
    }),
  );

  const refreshMedia = async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.media.pathKey() });
    toast.success("Media library refreshed.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
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
                items={mediaQuery.data ?? []}
                onSelect={(mediaId) => {
                  const selected = mediaQuery.data?.find((item) => item.id === mediaId);
                  if (!selected) {
                    return;
                  }

                  onSelect({
                    id: selected.id,
                    type: selected.type,
                    url: selected.url,
                    thumbnailUrl: selected.thumbnailUrl,
                    altText: selected.altText,
                    title: selected.title,
                    originalFilename: selected.originalFilename,
                    mimeType: selected.mimeType,
                    sizeBytes: selected.sizeBytes,
                  });
                  onOpenChange(false);
                }}
              />
            )}
          </div>

          <div className="space-y-3">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

