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

export function MediaUploadDropzone({
  endpoint,
  label,
  description,
  onUploadComplete,
}: MediaUploadDropzoneProps) {
  return (
    <div className="surface-panel space-y-3 p-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <UploadCloudIcon className="size-4" />
        </span>
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <UploadDropzone
        endpoint={endpoint}
        className="ut-label:text-foreground ut-button:bg-primary ut-button:text-primary-foreground ut-allowed-content:text-muted-foreground ut-upload-icon:text-muted-foreground ut-border-border ut-border-dashed ut-bg-muted/35 ut-button:hover:bg-primary/90"
        onClientUploadComplete={() => {
          toast.success(`${label} upload complete.`);
          onUploadComplete?.();
        }}
        onUploadError={(error) => {
          toast.error(error.message || "Upload failed.");
        }}
      />
    </div>
  );
}
