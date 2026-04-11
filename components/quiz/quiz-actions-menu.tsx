"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EllipsisVerticalIcon, PencilLineIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/hooks/use-trpc";
import { QUIZ_STATUS, type QuizStatus } from "@/lib/content/enums";
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

type QuizActionsMenuProps = {
  id: string;
  status: QuizStatus;
  isFeatured: boolean;
  editHref: string;
};

export function QuizActionsMenu({ id, status, isFeatured, editHref }: QuizActionsMenuProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.quiz.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.admin.pathKey() }),
    ]);
  };

  const publishMutation = useMutation(
    trpc.quiz.publish.mutationOptions({
      onSuccess: async () => {
        toast.success("Quiz published.");
        await refresh();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const draftMutation = useMutation(
    trpc.quiz.moveToDraft.mutationOptions({
      onSuccess: async () => {
        toast.success("Quiz moved to draft.");
        await refresh();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const closeMutation = useMutation(
    trpc.quiz.closeQuiz.mutationOptions({
      onSuccess: async () => {
        toast.success("Quiz closed.");
        await refresh();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const featuredMutation = useMutation(
    trpc.quiz.toggleFeatured.mutationOptions({
      onSuccess: async () => {
        toast.success(isFeatured ? "Removed featured flag." : "Marked as featured.");
        await refresh();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteMutation = useMutation(
    trpc.quiz.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Quiz deleted.");
        setIsDeleteOpen(false);
        await refresh();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const isBusy =
    publishMutation.isPending ||
    draftMutation.isPending ||
    closeMutation.isPending ||
    featuredMutation.isPending ||
    deleteMutation.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "rounded-md")}
        >
          <EllipsisVerticalIcon className="size-4" />
          <span className="sr-only">Open quiz actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Link href={editHref} className="flex w-full items-center gap-2">
              <PencilLineIcon className="size-4" />
              Edit quiz
            </Link>
          </DropdownMenuItem>

          {status !== QUIZ_STATUS.PUBLISHED ? (
            <DropdownMenuItem disabled={isBusy} onClick={() => publishMutation.mutate({ id })}>
              Publish
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled={isBusy} onClick={() => draftMutation.mutate({ id })}>
              Move to Draft
            </DropdownMenuItem>
          )}

          {status !== QUIZ_STATUS.CLOSED ? (
            <DropdownMenuItem disabled={isBusy} onClick={() => closeMutation.mutate({ id })}>
              Close Quiz
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuItem
            disabled={isBusy}
            onClick={() => featuredMutation.mutate({ id, value: !isFeatured })}
          >
            <SparklesIcon className="size-4" />
            {isFeatured ? "Remove Featured" : "Mark Featured"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={isBusy}
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2Icon className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete quiz?</DialogTitle>
            <DialogDescription>
              This will permanently remove the quiz, its questions, and all attempt records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ id })}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
