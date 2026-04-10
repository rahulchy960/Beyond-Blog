"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EllipsisVerticalIcon, PencilLineIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/hooks/use-trpc";
import { COURSE_STATUS, type CourseStatus } from "@/lib/content/enums";
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

type CourseActionsMenuProps = {
  id: string;
  status: CourseStatus;
  isFeatured: boolean;
  editHref: string;
};

export function CourseActionsMenu({ id, status, isFeatured, editHref }: CourseActionsMenuProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.course.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.admin.pathKey() }),
    ]);
  };

  const publishMutation = useMutation(
    trpc.course.publish.mutationOptions({
      onSuccess: async () => {
        toast.success("Course published.");
        await invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const unpublishMutation = useMutation(
    trpc.course.unpublish.mutationOptions({
      onSuccess: async () => {
        toast.success("Course moved to draft.");
        await invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const archiveMutation = useMutation(
    trpc.course.archive.mutationOptions({
      onSuccess: async () => {
        toast.success("Course archived.");
        await invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const toggleFeaturedMutation = useMutation(
    trpc.course.toggleFeatured.mutationOptions({
      onSuccess: async () => {
        toast.success(isFeatured ? "Featured removed." : "Marked as featured.");
        await invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteMutation = useMutation(
    trpc.course.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Course deleted.");
        setIsDeleteDialogOpen(false);
        await invalidateQueries();
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
          <span className="sr-only">Open course actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Link href={editHref} className="flex w-full items-center gap-2">
              <PencilLineIcon className="size-4" />
              Edit
            </Link>
          </DropdownMenuItem>

          {status !== COURSE_STATUS.PUBLISHED ? (
            <DropdownMenuItem disabled={isBusy} onClick={() => publishMutation.mutate({ id })}>
              Publish
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled={isBusy} onClick={() => unpublishMutation.mutate({ id })}>
              Move to Draft
            </DropdownMenuItem>
          )}

          {status !== COURSE_STATUS.ARCHIVED ? (
            <DropdownMenuItem disabled={isBusy} onClick={() => archiveMutation.mutate({ id })}>
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
            <DialogTitle>Delete course</DialogTitle>
            <DialogDescription>
              This will remove the course, sections, and lessons permanently.
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

