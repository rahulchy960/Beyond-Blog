"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EllipsisVerticalIcon, PencilLineIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/hooks/use-trpc";
import { PUBLISH_STATUS, type PublishStatus } from "@/lib/content/enums";
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

type ContentActionsMenuProps = {
  id: string;
  status: PublishStatus;
  isFeatured: boolean;
  editHref: string;
};

export function ContentActionsMenu({ id, status, isFeatured, editHref }: ContentActionsMenuProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const invalidateContentQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.content.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.admin.pathKey() }),
    ]);
  };

  const publishMutation = useMutation(
    trpc.content.publish.mutationOptions({
      onSuccess: async () => {
        toast.success("Content published.");
        await invalidateContentQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const unpublishMutation = useMutation(
    trpc.content.unpublish.mutationOptions({
      onSuccess: async () => {
        toast.success("Moved to draft.");
        await invalidateContentQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const archiveMutation = useMutation(
    trpc.content.archive.mutationOptions({
      onSuccess: async () => {
        toast.success("Content archived.");
        await invalidateContentQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const toggleFeaturedMutation = useMutation(
    trpc.content.toggleFeatured.mutationOptions({
      onSuccess: async () => {
        toast.success(isFeatured ? "Featured removed." : "Marked as featured.");
        await invalidateContentQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteMutation = useMutation(
    trpc.content.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Content deleted.");
        setIsDeleteDialogOpen(false);
        await invalidateContentQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const isBusy =
    publishMutation.isPending ||
    unpublishMutation.isPending ||
    archiveMutation.isPending ||
    toggleFeaturedMutation.isPending ||
    deleteMutation.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "rounded-md")}
        >
          <EllipsisVerticalIcon className="size-4" />
          <span className="sr-only">Open actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Link href={editHref} className="flex w-full items-center gap-2">
              <PencilLineIcon className="size-4" />
              Edit
            </Link>
          </DropdownMenuItem>

          {status !== PUBLISH_STATUS.PUBLISHED ? (
            <DropdownMenuItem
              disabled={isBusy}
              onClick={() => publishMutation.mutate({ id })}
            >
              Publish
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={isBusy}
              onClick={() => unpublishMutation.mutate({ id })}
            >
              Move to Draft
            </DropdownMenuItem>
          )}

          {status !== PUBLISH_STATUS.ARCHIVED ? (
            <DropdownMenuItem
              disabled={isBusy}
              onClick={() => archiveMutation.mutate({ id })}
            >
              Archive
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuItem
            disabled={isBusy}
            onClick={() => toggleFeaturedMutation.mutate({ id, value: !isFeatured })}
          >
            {isFeatured ? "Remove Featured" : "Mark Featured"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={isBusy}
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2Icon className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The content entry and linked guest interactions will be
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ id })}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
