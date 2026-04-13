import { createRouteHandler } from "uploadthing/next";
import { beyondBlogFileRouter } from "@/server/uploadthing/core";

export const { GET, POST } = createRouteHandler({
  router: beyondBlogFileRouter,
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
