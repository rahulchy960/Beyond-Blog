import { createRouteHandler } from "uploadthing/next";
import { beyondBlogFileRouter } from "@/server/uploadthing/core";
import { env } from "@/lib/env";

export const { GET, POST } = createRouteHandler({
  router: beyondBlogFileRouter,
  config: {
    callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/api/uploadthing`,
    token: env.UPLOADTHING_TOKEN,
  },
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
