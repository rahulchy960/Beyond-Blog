import { NotFoundShell } from "@/components/ui/not-found-shell";

export default function RootNotFoundPage() {
  return (
    <NotFoundShell
      title="Page not found"
      description="The page you requested doesn't exist or may have moved."
      homeHref="/"
      secondaryHref="/search"
      secondaryLabel="Search Beyond Blog"
    />
  );
}
