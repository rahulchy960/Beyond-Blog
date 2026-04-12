"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { type MediaType } from "@/lib/content/enums";
import { useTRPC } from "@/hooks/use-trpc";
import { toUserErrorMessage } from "@/lib/errors/client";
import { MediaFilters } from "@/components/media/media-filters";
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
import { Label } from "@/components/ui/label";
import { MediaGridSkeleton } from "@/components/ui/loading-skeletons";
import { PageHeader } from "@/components/ui/page-header";
import { RetryPanel } from "@/components/ui/retry-panel";

export function MediaLibraryAdminScreen() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [type, setType] = useState<"all" | MediaType>("all");
  const [query, setQuery] = useState("");
  const [isExternalVideoOpen, setIsExternalVideoOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoExternalUrl, setVideoExternalUrl] = useState("");
  const [videoPlaybackUrl, setVideoPlaybackUrl] = useState("");
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState("");
  const [videoProvider, setVideoProvider] = useState("external");
  const [videoProviderAssetId, setVideoProviderAssetId] = useState("");

  const mediaQuery = useQuery(
    trpc.media.list.queryOptions({
      type: type === "all" ? undefined : type,
      query: query || undefined,
      limit: 80,
      sort: "newest",
    }),
  );

  const refreshMedia = async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.media.pathKey() });
  };

  const createExternalVideoMutation = useMutation(
    trpc.media.createExternalVideo.mutationOptions({
      onSuccess: async () => {
        toast.success("External video media entry created.");
        setIsExternalVideoOpen(false);
        setVideoTitle("");
        setVideoExternalUrl("");
        setVideoPlaybackUrl("");
        setVideoThumbnailUrl("");
        setVideoProvider("external");
        setVideoProviderAssetId("");
        await refreshMedia();
      },
      onError: (error) =>
        toast.error(toUserErrorMessage(error, "Unable to create external video entry.")),
    }),
  );

  const items = useMemo(() => mediaQuery.data?.items ?? [], [mediaQuery.data?.items]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Media Library"
        description="Upload, organize, and reuse images, files, and future-ready video assets."
        actions={
          <Button variant="outline" size="sm" onClick={() => setIsExternalVideoOpen(true)}>
            <PlusIcon className="size-4" />
            Add external video
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <MediaUploadDropzone
          endpoint="mediaImage"
          label="Image uploads"
          description="Drag and drop, or click to upload. Supports PNG, JPG, WEBP, and GIF."
          onUploadComplete={refreshMedia}
        />
        <MediaUploadDropzone
          endpoint="mediaFile"
          label="File uploads"
          description="Upload PDF and common office document types."
          onUploadComplete={refreshMedia}
        />
      </div>

      <MediaFilters type={type} query={query} onTypeChange={setType} onQueryChange={setQuery} />

      {mediaQuery.isPending ? (
        <MediaGridSkeleton count={8} />
      ) : mediaQuery.isError ? (
        <RetryPanel
          title="Unable to load media library"
          error={mediaQuery.error}
          onRetry={() => mediaQuery.refetch()}
          retryLabel="Reload media"
        />
      ) : (
        <MediaLibraryGrid items={items} />
      )}

      <Dialog open={isExternalVideoOpen} onOpenChange={setIsExternalVideoOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create External Video Entry</DialogTitle>
            <DialogDescription>
              Register video metadata now and connect provider workflows like Mux later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="videoTitle">Title (optional)</Label>
              <Input
                id="videoTitle"
                value={videoTitle}
                onChange={(event) => setVideoTitle(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="videoExternalUrl">External URL</Label>
              <Input
                id="videoExternalUrl"
                value={videoExternalUrl}
                onChange={(event) => setVideoExternalUrl(event.target.value)}
                placeholder="https://example.com/video/source"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="videoPlaybackUrl">Playback URL (optional)</Label>
              <Input
                id="videoPlaybackUrl"
                value={videoPlaybackUrl}
                onChange={(event) => setVideoPlaybackUrl(event.target.value)}
                placeholder="https://stream.example.com/playback.m3u8"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="videoThumbnailUrl">Thumbnail URL (optional)</Label>
              <Input
                id="videoThumbnailUrl"
                value={videoThumbnailUrl}
                onChange={(event) => setVideoThumbnailUrl(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="videoProvider">Provider</Label>
              <Input
                id="videoProvider"
                value={videoProvider}
                onChange={(event) => setVideoProvider(event.target.value || "external")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="videoProviderAssetId">Provider Asset ID (optional)</Label>
              <Input
                id="videoProviderAssetId"
                value={videoProviderAssetId}
                onChange={(event) => setVideoProviderAssetId(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExternalVideoOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createExternalVideoMutation.isPending || !videoExternalUrl.trim()}
              onClick={() =>
                createExternalVideoMutation.mutate({
                  title: videoTitle || null,
                  externalUrl: videoExternalUrl.trim(),
                  playbackUrl: videoPlaybackUrl.trim() ? videoPlaybackUrl.trim() : null,
                  thumbnailUrl: videoThumbnailUrl.trim() ? videoThumbnailUrl.trim() : null,
                  provider:
                    videoProvider.trim().toLowerCase() === "mux"
                      ? "mux"
                      : videoProvider.trim().toLowerCase() === "uploadthing"
                        ? "uploadthing"
                        : "external",
                  providerAssetId: videoProviderAssetId.trim() ? videoProviderAssetId.trim() : null,
                })
              }
            >
              <VideoIcon className="size-4" />
              Create video entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
