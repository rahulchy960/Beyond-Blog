import Link from "next/link";
import { platformName } from "@/lib/constants";
import { SiteContainer } from "@/components/layout/site-container";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60">
      <SiteContainer className="flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          {platformName} © {year}. Modern academic publishing and public learning.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/journals" className="hover:text-foreground">
            Journals
          </Link>
          <Link href="/articles" className="hover:text-foreground">
            Articles
          </Link>
          <Link href="/projects" className="hover:text-foreground">
            Projects
          </Link>
        </div>
      </SiteContainer>
    </footer>
  );
}
