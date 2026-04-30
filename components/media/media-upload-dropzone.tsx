"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadCloudIcon } from "lucide-react";
import { toast } from "sonner";
import { UploadDropzone } from "@/lib/uploadthing/components";
import { normalizeUploadThingFile } from "@/lib/uploadthing/file-metadata";
import type { BeyondBlogFileRouter } from "@/server/uploadthing/core";
import { toUserErrorMessage } from "@/lib/errors/client";
import { useTRPC } from "@/hooks/use-trpc";

type UploadEndpoint = keyof BeyondBlogFileRouter;

type MediaUploadDropzoneProps = {
  endpoint: UploadEndpoint;
  label: string;
  description: string;
  onUploadComplete?: () => Promise<void> | void;
};

function mapUploadErrorToMessage(error: { message?: string } | null | undefined) {
  const message = (error?.message ?? "").toLowerCase();

  if (message.includes("file size") || message.includes("too large")) {
    return "File is too large for this upload endpoint. Choose a smaller file and retry.";
  }

  if (message.includes("mime") || message.includes("type") || message.includes("unsupported")) {
    return "This file type is not supported for this upload area.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Upload failed due to a network issue. Check connectivity and retry.";
  }

  return error?.message || "Upload failed. Please retry.";
}

export function MediaUploadDropzone({
  endpoint,
  label,
  description,
  onUploadComplete,
}: MediaUploadDropzoneProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const registerUploadMutation = useMutation(trpc.media.registerUpload.mutationOptions());

  const refreshMediaQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.media.pathKey() });
    await queryClient.refetchQueries({ queryKey: trpc.media.pathKey(), type: "active" });
  };

  return (
    <div className="surface-panel relative isolate space-y-3 overflow-visible p-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex size-8 items-center justify-center rounded-lg border border-border/70 bg-surface-soft text-secondary-foreground">
          <UploadCloudIcon className="size-4" />
        </span>
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <UploadDropzone
        endpoint={endpoint}
        className="ut-label:text-foreground ut-button:bg-primary ut-button:text-primary-foreground ut-allowed-content:text-muted-foreground ut-upload-icon:text-muted-foreground ut-border-border ut-border-dashed ut-bg-muted/35 ut-button:hover:bg-primary/90 ut-button:rounded-lg"
        onClientUploadComplete={async (files) => {
          try {
            await Promise.all(
              files.map((file) => {
                const normalized = normalizeUploadThingFile(file);

                return registerUploadMutation.mutateAsync(normalized);
              }),
            );

            await refreshMediaQueries();
            await onUploadComplete?.();
            toast.success(`${label} upload complete.`);
          } catch (error) {
            toast.error(toUserErrorMessage(error, "Upload succeeded, but media registration failed."));
          }
        }}
        onUploadError={(error) => {
          toast.error(mapUploadErrorToMessage(error));
        }}
      />
    </div>
  );
}
