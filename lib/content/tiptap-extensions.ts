import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";

export const tiptapDocumentExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    link: false,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      rel: "noopener noreferrer nofollow",
      target: "_blank",
    },
  }),
  Image.configure({
    inline: false,
    allowBase64: false,
  }),
];

export const tiptapEditorExtensions = [
  ...tiptapDocumentExtensions,
  Placeholder.configure({
    placeholder: "Write the body content...",
  }),
];
