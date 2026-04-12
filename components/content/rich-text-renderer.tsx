type RichTextRendererProps = {
  html: string | null | undefined;
  emptyLabel?: string;
};

export function RichTextRenderer({
  html,
  emptyLabel = "Content is unavailable for this section.",
}: RichTextRendererProps) {
  const normalized = typeof html === "string" ? html.trim() : "";
  if (normalized.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 bg-surface-soft/70 px-4 py-5 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      className="editorial-prose mx-auto max-w-3xl"
      dangerouslySetInnerHTML={{ __html: normalized }}
    />
  );
}
