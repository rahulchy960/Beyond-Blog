import { http, HttpResponse } from "msw";

function parseTrpcPath(pathname: string) {
  const prefix = "/api/trpc/";
  if (!pathname.startsWith(prefix)) return "";
  return pathname.slice(prefix.length);
}

export const handlers = [
  http.get("*/api/uploadthing", () => {
    return HttpResponse.json([
      {
        slug: "mediaImage",
        config: {
          image: { maxFileSize: "8MB", maxFileCount: 6 },
        },
      },
      {
        slug: "mediaFile",
        config: {
          blob: { maxFileSize: "16MB", maxFileCount: 6 },
        },
      },
    ]);
  }),
  http.post("*/api/uploadthing", () => {
    return HttpResponse.json({ ok: true });
  }),
  http.all("*/api/trpc/*", ({ request }) => {
    const url = new URL(request.url);
    const procedurePath = parseTrpcPath(url.pathname);
    return HttpResponse.json({
      error: {
        code: "NOT_IMPLEMENTED",
        message: `No MSW handler for tRPC procedure "${procedurePath}"`,
      },
    }, { status: 501 });
  }),
];
