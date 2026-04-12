"use client";

import { UploadCloudIcon } from "lucide-react";
import { toast } from "sonner";
import { UploadDropzone } from "@/lib/uploadthing/components";
import type { BeyondBlogFileRouter } from "@/server/uploadthing/core";

type UploadEndpoint = keyof BeyondBlogFileRouter;

type MediaUploadDropzoneProps = {
  endpoint: UploadEndpoint;
  label: string;
  description: string;
  onUploadComplete?: () => void;
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
  return (
    <div className="surface-panel space-y-3 p-4">
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
        onClientUploadComplete={() => {
          toast.success(`${label} upload complete.`);
          onUploadComplete?.();
        }}
        onUploadError={(error) => {
          toast.error(mapUploadErrorToMessage(error));
        }}
      />
    </div>
  );
}
