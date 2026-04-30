import { describe, expect, it } from "vitest";
import {
  extractUploadUrl,
  getUploadThingFileKey,
  getUploadThingFileMimeType,
  getUploadThingFileName,
  getUploadThingFileSizeBytes,
  getUploadThingFileUrl,
  normalizeUploadThingFile,
} from "@/lib/uploadthing/file-metadata";

describe("UploadThing file metadata helpers", () => {
  it("prefers the current ufsUrl field as the renderable URL", () => {
    expect(
      getUploadThingFileUrl({
        ufsUrl: "https://utfs.io/f/current-image.png",
        url: "https://legacy.example/old-image.png",
        appUrl: "https://app.example/old-image.png",
      }),
    ).toBe("https://utfs.io/f/current-image.png");
  });

  it("exposes extractUploadUrl for registering UploadThing files", () => {
    expect(extractUploadUrl({ ufsUrl: "https://utfs.io/f/uploaded.png" })).toBe(
      "https://utfs.io/f/uploaded.png",
    );
  });

  it("supports legacy UploadThing URL aliases", () => {
    expect(getUploadThingFileUrl({ url: "https://legacy.example/file.pdf" })).toBe(
      "https://legacy.example/file.pdf",
    );
    expect(getUploadThingFileUrl({ appUrl: "https://app.example/file.pdf" })).toBe(
      "https://app.example/file.pdf",
    );
  });

  it("normalizes UploadThing fileUrl/fileKey/fileName variants for registration", () => {
    expect(
      normalizeUploadThingFile({
        fileUrl: "https://utfs.io/f/file-url-image.png",
        fileKey: "file-key",
        fileName: "file-url-image.png",
        size: 4321,
        type: "image/png",
      }),
    ).toEqual({
      url: "https://utfs.io/f/file-url-image.png",
      key: "file-key",
      name: "file-url-image.png",
      size: 4321,
      mimeType: "image/png",
    });
  });

  it("normalizes sparse callback data with URL fallback as the duplicate key", () => {
    expect(
      normalizeUploadThingFile({
        serverData: {
          media: {
            url: "https://utfs.io/f/callback-only.png",
            title: "Callback only",
          },
        },
      }),
    ).toEqual({
      url: "https://utfs.io/f/callback-only.png",
      key: "https://utfs.io/f/callback-only.png",
      name: "Callback only",
      size: undefined,
      mimeType: undefined,
    });
  });

  it("supports serverData media returned by the UploadThing callback", () => {
    const file = {
      serverData: {
        media: {
          url: "https://utfs.io/f/server-data-image.png",
          storageKey: "server-data-key",
          originalFilename: "server-data-image.png",
          mimeType: "image/png",
          sizeBytes: 1234,
        },
      },
    };

    expect(getUploadThingFileUrl(file)).toBe("https://utfs.io/f/server-data-image.png");
    expect(getUploadThingFileKey(file)).toBe("server-data-key");
    expect(getUploadThingFileName(file)).toBe("server-data-image.png");
    expect(getUploadThingFileMimeType(file, "application/octet-stream")).toBe("image/png");
    expect(getUploadThingFileSizeBytes(file)).toBe(1234);
  });

  it("falls back to fileHash as a storage key when UploadThing omits key", () => {
    expect(getUploadThingFileKey({ fileHash: "hash-key" })).toBe("hash-key");
  });

  it("throws a clear error when no renderable URL exists", () => {
    expect(() => getUploadThingFileUrl({ key: "uploaded-file" })).toThrow(
      "Upload completed, but UploadThing did not return a renderable file URL.",
    );
  });
});
