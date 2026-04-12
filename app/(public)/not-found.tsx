import { NotFoundShell } from "@/components/ui/not-found-shell";

export default function PublicNotFoundPage() {
  return (
    <NotFoundShell
      title="This publication is unavailable"
      description="It may have been removed, is not yet published, or the URL is incorrect."
      homeHref="/"
      secondaryHref="/search"
      secondaryLabel="Find published content"
    />
  );
}
