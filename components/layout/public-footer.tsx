import Link from "next/link";
import { platformName } from "@/lib/constants";
import { SiteContainer } from "@/components/layout/site-container";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70 bg-surface-soft/40">
      <SiteContainer className="flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl space-y-1.5">
          <p className="leading-6">
            {platformName} &copy; {year}. Modern academic publishing and public learning.
          </p>
          <p className="text-[0.68rem] tracking-[0.14em] uppercase">Built for open scholarly reading</p>
        </div>
        <div className="flex items-center gap-5 text-[0.82rem] md:justify-end">
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
