type RichTextRendererProps = {
  html: string;
};

export function RichTextRenderer({ html }: RichTextRendererProps) {
  return (
    <div
      className="space-y-4 leading-7 text-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_h1]:font-heading [&_h1]:text-3xl [&_h2]:font-heading [&_h2]:text-2xl [&_h3]:font-heading [&_h3]:text-xl [&_img]:rounded-xl [&_img]:border [&_img]:border-border/70 [&_img]:bg-muted [&_li]:ml-4 [&_ol]:list-decimal [&_p]:text-base [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
