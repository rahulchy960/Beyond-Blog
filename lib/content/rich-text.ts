import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import { tiptapDocumentExtensions } from "@/lib/content/tiptap-extensions";

export const emptyRichTextDocument = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
} satisfies JSONContent;

function isJSONObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeRichTextNode(value: unknown): JSONContent | null {
  if (!isJSONObject(value) || typeof value.type !== "string") {
    return null;
  }

  const node = value as JSONContent;

  if (node.type === "text") {
    const text = typeof node.text === "string" ? node.text : "";
    if (text.length === 0) {
      return null;
    }

    return {
      ...node,
      text,
    };
  }

  const childNodes = Array.isArray(node.content)
    ? node.content
        .map((childNode) => sanitizeRichTextNode(childNode))
        .filter((childNode): childNode is JSONContent => childNode !== null)
    : undefined;

  return {
    ...node,
    ...(childNodes ? { content: childNodes } : {}),
  };
}

export function normalizeRichTextDocument(value: unknown): JSONContent {
  const sanitized = sanitizeRichTextNode(value);
  if (!sanitized || sanitized.type !== "doc") {
    return emptyRichTextDocument;
  }

  if (!Array.isArray(sanitized.content) || sanitized.content.length === 0) {
    return emptyRichTextDocument;
  }

  return sanitized;
}

export function buildHtmlFromRichText(value: unknown): string {
  const document = normalizeRichTextDocument(value);
  return generateHTML(document, tiptapDocumentExtensions);
}
