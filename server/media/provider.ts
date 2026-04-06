import "server-only";
import { UTApi } from "uploadthing/server";

let cachedUtapi: UTApi | null = null;

function getUploadThingApi() {
  if (!process.env.UPLOADTHING_TOKEN) {
    return null;
  }

  if (!cachedUtapi) {
    cachedUtapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });
  }

  return cachedUtapi;
}

export async function deleteProviderAsset(args: {
  storageProvider?: string | null;
  storageKey?: string | null;
}) {
  if (!args.storageProvider || !args.storageKey) {
    return;
  }

  if (args.storageProvider !== "uploadthing") {
    return;
  }

  const utapi = getUploadThingApi();
  if (!utapi) {
    return;
  }

  try {
    await utapi.deleteFiles(args.storageKey);
  } catch (error) {
    console.error("[media] Failed to delete UploadThing file:", error);
  }
}
