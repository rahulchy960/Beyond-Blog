"use client";

import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  BoldIcon,
  Code2Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PilcrowIcon,
  QuoteIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { tiptapEditorExtensions } from "@/lib/content/tiptap-extensions";
import { normalizeRichTextDocument } from "@/lib/content/rich-text";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { toUserErrorMessage } from "@/lib/errors/client";

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  icon: React.ReactNode;
  label: string;
};

function ToolbarButton({ onClick, active, icon, label }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" }),
        "h-8 w-8 rounded-md p-0",
      )}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

type TiptapEditorProps = {
  value: JSONContent;
  onChange: (value: JSONContent) => void;
};

export function TiptapEditor({ value, onChange }: TiptapEditorProps) {
  const normalizedValue = normalizeRichTextDocument(value);
  const [editorSyncError, setEditorSyncError] = useState<unknown>(null);

  const editor = useEditor({
    extensions: tiptapEditorExtensions,
    content: normalizedValue,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[380px] w-full rounded-xl border border-border/70 bg-reading-surface/80 px-4 py-3 text-sm leading-7 outline-none focus-visible:ring-2 focus-visible:ring-ring",
      },
    },
    onUpdate: ({ editor: tiptapEditor }) => {
      try {
        onChange(tiptapEditor.getJSON());
        if (editorSyncError) {
          setEditorSyncError(null);
        }
      } catch (error) {
        setEditorSyncError(error);
      }
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(normalizedValue)) {
      try {
        editor.commands.setContent(normalizedValue, { emitUpdate: false });
      } catch (error) {
        queueMicrotask(() => setEditorSyncError(error));
      }
    }
  }, [editor, normalizedValue]);

  if (!editor) {
    return (
      <div className="min-h-[360px] animate-pulse rounded-xl border border-border/70 bg-muted/45" />
    );
  }

  if (editorSyncError) {
    return (
      <ErrorState
        title="Editor failed to load content"
        description={toUserErrorMessage(
          editorSyncError,
          "The rich text document could not be rendered. You can reset to a clean draft.",
        )}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const fallback = normalizeRichTextDocument(null);
              onChange(fallback);
              setEditorSyncError(null);
              editor.commands.setContent(fallback, { emitUpdate: false });
            }}
          >
            Reset editor content
          </Button>
        }
      />
    );
  }

  return (
    <div className="surface-editor space-y-3 p-3">
      <div className="toolbar-row">
        <ToolbarButton
          label="Paragraph"
          icon={<PilcrowIcon className="size-4" />}
          active={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
        />
        <ToolbarButton
          label="Heading 1"
          icon={<Heading1Icon className="size-4" />}
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolbarButton
          label="Heading 2"
          icon={<Heading2Icon className="size-4" />}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          label="Heading 3"
          icon={<Heading3Icon className="size-4" />}
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <span className="mx-0.5 h-6 w-px bg-border" />
        <ToolbarButton
          label="Bold"
          icon={<BoldIcon className="size-4" />}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italic"
          icon={<ItalicIcon className="size-4" />}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <span className="mx-0.5 h-6 w-px bg-border" />
        <ToolbarButton
          label="Bulleted list"
          icon={<ListIcon className="size-4" />}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="Ordered list"
          icon={<ListOrderedIcon className="size-4" />}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="Blockquote"
          icon={<QuoteIcon className="size-4" />}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          label="Code block"
          icon={<Code2Icon className="size-4" />}
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
        <span className="mx-0.5 h-6 w-px bg-border" />
        <ToolbarButton
          label="Horizontal rule"
          icon={<MinusIcon className="size-4" />}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
        <ToolbarButton
          label="Insert link"
          icon={<LinkIcon className="size-4" />}
          active={editor.isActive("link")}
          onClick={() => {
            const link = window.prompt("Enter URL");
            if (!link) return;
            editor.chain().focus().extendMarkRange("link").setLink({ href: link }).run();
          }}
        />
        <ToolbarButton
          label="Insert image placeholder"
          icon={<ImageIcon className="size-4" />}
          onClick={() => {
            const imageUrl = window.prompt("Enter image URL");
            if (!imageUrl) return;
            editor.chain().focus().setImage({ src: imageUrl }).run();
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
