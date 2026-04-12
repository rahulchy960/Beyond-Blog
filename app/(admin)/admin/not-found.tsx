import { NotFoundShell } from "@/components/ui/not-found-shell";

export default function AdminNotFoundPage() {
  return (
    <NotFoundShell
      title="Admin record not found"
      description="The requested admin resource is unavailable or the URL is invalid."
      homeHref="/admin"
      homeLabel="Back to dashboard"
      secondaryHref="/admin/content"
      secondaryLabel="Open content manager"
    />
  );
}
