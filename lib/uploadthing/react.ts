"use client";

import { generateReactHelpers } from "@uploadthing/react";
import type { BeyondBlogFileRouter } from "@/server/uploadthing/core";

export const { useUploadThing, uploadFiles } = generateReactHelpers<BeyondBlogFileRouter>();
