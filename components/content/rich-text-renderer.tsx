type RichTextRendererProps = {
  html: string;
};

export function RichTextRenderer({ html }: RichTextRendererProps) {
  return (
    <div
      className="editorial-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
