import { createRouteHandler } from "uploadthing/next";
import { beyondBlogFileRouter } from "@/server/uploadthing/core";

export const { GET, POST } = createRouteHandler({
  router: beyondBlogFileRouter,
});
