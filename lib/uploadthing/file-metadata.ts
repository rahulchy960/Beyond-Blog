function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedRecord(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return isRecord(value) ? value : null;
}

function getCandidateRecords(file: unknown) {
  if (!isRecord(file)) {
    return [];
  }

  const serverData = getNestedRecord(file, "serverData");
  const serverMedia = serverData ? getNestedRecord(serverData, "media") : null;

  return [file, serverMedia, serverData].filter((record): record is Record<string, unknown> => Boolean(record));
}

function getStringField(file: unknown, fields: string[]) {
  for (const record of getCandidateRecords(file)) {
    for (const field of fields) {
      const value = record[field];
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
    }
  }

  return null;
}

function getNumberField(file: unknown, fields: string[]) {
  for (const record of getCandidateRecords(file)) {
    for (const field of fields) {
      const value = record[field];
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }
  }

  return null;
}

export function getUploadThingFileUrl(file: unknown) {
  const url = getStringField(file, ["ufsUrl", "url", "appUrl", "fileUrl"]);

  if (!url) {
    throw new Error("Upload completed, but UploadThing did not return a renderable file URL.");
  }

  return url;
}

export function extractUploadUrl(file: unknown): string {
  return getUploadThingFileUrl(file);
}

export function getUploadThingFileKey(file: unknown) {
  const key = getStringField(file, [
    "key",
    "fileKey",
    "storageKey",
    "providerAssetId",
    "fileHash",
    "customId",
  ]);

  if (!key) {
    throw new Error("Upload completed, but UploadThing did not return a file key.");
  }

  return key;
}

export function getUploadThingFileName(file: unknown) {
  return getStringField(file, ["name", "fileName", "originalFilename", "title"]) ?? "Untitled upload";
}

export function getUploadThingFileMimeType(file: unknown, fallback: string) {
  return getStringField(file, ["type", "mimeType"]) ?? fallback;
}

export function getUploadThingFileSizeBytes(file: unknown) {
  return getNumberField(file, ["size", "sizeBytes"]) ?? 0;
}

export function getUploadThingFileDimension(file: unknown, dimension: "width" | "height") {
  const value = getNumberField(file, [dimension]);
  return value && value > 0 ? value : null;
}

export function normalizeUploadThingFile(file: unknown) {
  const url = getUploadThingFileUrl(file);

  return {
    url,
    key:
      getStringField(file, [
        "key",
        "fileKey",
        "storageKey",
        "providerAssetId",
        "fileHash",
        "customId",
      ]) ?? url,
    name: getUploadThingFileName(file),
    size: getNumberField(file, ["size", "sizeBytes"]) ?? undefined,
    mimeType: getStringField(file, ["type", "mimeType"]) ?? undefined,
  };
}
