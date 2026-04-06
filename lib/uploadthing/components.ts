"use client";

import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import type { BeyondBlogFileRouter } from "@/server/uploadthing/core";

export const UploadButton = generateUploadButton<BeyondBlogFileRouter>();
export const UploadDropzone = generateUploadDropzone<BeyondBlogFileRouter>();
