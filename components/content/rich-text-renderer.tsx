type RichTextRendererProps = {
  html: string;
};

export function RichTextRenderer({ html }: RichTextRendererProps) {
  return (
    <div
      className="editorial-prose mx-auto max-w-3xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
