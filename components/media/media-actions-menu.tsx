"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CopyIcon,
  EllipsisVerticalIcon,
  PencilLineIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/hooks/use-trpc";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type MediaType } from "@/lib/content/enums";

type MediaActionsMenuProps = {
  media: {
    id: string;
    type: MediaType;
    url: string;
    title: string | null;
    altText: string | null;
    caption: string | null;
    thumbnailUrl: string | null;
    externalUrl: string | null;
    playbackUrl: string | null;
  };
  onSelect?: (mediaId: string) => void;
};

export function MediaActionsMenu({ media, onSelect }: MediaActionsMenuProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [title, setTitle] = useState(media.title ?? "");
  const [altText, setAltText] = useState(media.altText ?? "");
  const [caption, setCaption] = useState(media.caption ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(media.thumbnailUrl ?? "");
  const [externalUrl, setExternalUrl] = useState(media.externalUrl ?? "");
  const [playbackUrl, setPlaybackUrl] = useState(media.playbackUrl ?? "");

  const openEditDialog = () => {
    setTitle(media.title ?? "");
    setAltText(media.altText ?? "");
    setCaption(media.caption ?? "");
    setThumbnailUrl(media.thumbnailUrl ?? "");
    setExternalUrl(media.externalUrl ?? "");
    setPlaybackUrl(media.playbackUrl ?? "");
    setIsEditOpen(true);
  };

  const invalidateMediaQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.media.pathKey() });
    await queryClient.invalidateQueries({ queryKey: trpc.content.pathKey() });
  };

  const updateMutation = useMutation(
    trpc.media.updateMetadata.mutationOptions({
      onSuccess: async () => {
        toast.success("Media metadata updated.");
        setIsEditOpen(false);
        await invalidateMediaQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteMutation = useMutation(
    trpc.media.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Media asset deleted.");
        setIsDeleteOpen(false);
        await invalidateMediaQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const isBusy = updateMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}>
          <EllipsisVerticalIcon className="size-4" />
          <span className="sr-only">Open media actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onSelect ? (
            <DropdownMenuItem onClick={() => onSelect(media.id)}>Select asset</DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(media.url);
                toast.success("URL copied.");
              } catch {
                toast.error("Failed to copy URL.");
              }
            }}
          >
            <CopyIcon className="size-4" />
            Copy URL
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openEditDialog}>
            <PencilLineIcon className="size-4" />
            Edit metadata
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2Icon className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Media Metadata</DialogTitle>
            <DialogDescription>Update labels and descriptive fields for reuse.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`media-title-${media.id}`}>Title</Label>
              <Input
                id={`media-title-${media.id}`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`media-alt-${media.id}`}>Alt text</Label>
              <Input
                id={`media-alt-${media.id}`}
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`media-caption-${media.id}`}>Caption</Label>
              <Textarea
                id={`media-caption-${media.id}`}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`media-thumbnail-${media.id}`}>Thumbnail URL</Label>
              <Input
                id={`media-thumbnail-${media.id}`}
                value={thumbnailUrl}
                onChange={(event) => setThumbnailUrl(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`media-external-${media.id}`}>External URL (videos)</Label>
              <Input
                id={`media-external-${media.id}`}
                value={externalUrl}
                onChange={(event) => setExternalUrl(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`media-playback-${media.id}`}>Playback URL (videos)</Label>
              <Input
                id={`media-playback-${media.id}`}
                value={playbackUrl}
                onChange={(event) => setPlaybackUrl(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              disabled={isBusy}
              onClick={() =>
                updateMutation.mutate({
                  id: media.id,
                  title: title || null,
                  altText: altText || null,
                  caption: caption || null,
                  thumbnailUrl: thumbnailUrl || null,
                  externalUrl: externalUrl || null,
                  playbackUrl: playbackUrl || null,
                })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete media asset</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Existing content references should be updated after deletion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate({ id: media.id })}
              disabled={isBusy}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
