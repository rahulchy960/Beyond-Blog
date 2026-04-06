import { FileIcon, FileVideoIcon, ImageIcon } from "lucide-react";
import { MEDIA_TYPE, type MediaType } from "@/lib/content/enums";

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[index]}`;
}

export function getMediaTypeLabel(type: MediaType) {
  if (type === MEDIA_TYPE.IMAGE) {
    return "Image";
  }
  if (type === MEDIA_TYPE.VIDEO) {
    return "Video";
  }
  return "File";
}

export function getMediaTypeIcon(type: MediaType) {
  if (type === MEDIA_TYPE.IMAGE) {
    return ImageIcon;
  }
  if (type === MEDIA_TYPE.VIDEO) {
    return FileVideoIcon;
  }
  return FileIcon;
}
