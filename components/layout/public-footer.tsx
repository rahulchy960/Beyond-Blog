import Link from "next/link";
import { getServerCaller } from "@/server/api/caller";
import { platformName } from "@/lib/constants";
import { SiteContainer } from "@/components/layout/site-container";

function hasValue(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

export async function PublicFooter() {
  const year = new Date().getFullYear();
  const caller = await getServerCaller();
  const profile = await caller.profile.getPublicFooterProfile();

  const socialLinks = [
    { label: "LinkedIn", href: profile?.linkedinUrl },
    { label: "GitHub", href: profile?.githubUrl },
    { label: "Twitter", href: profile?.twitterUrl },
    { label: "Website", href: profile?.websiteUrl },
  ].filter((item) => hasValue(item.href));

  return (
    <footer className="border-t border-border/70 bg-surface-soft/40">
      <SiteContainer className="space-y-7 py-8 text-sm text-muted-foreground">
        {profile ? (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-3">
              {hasValue(profile.fullName) ? <p className="text-base font-semibold text-foreground">{profile.fullName}</p> : null}
              {hasValue(profile.designation) ? <p>{profile.designation}</p> : null}
              {hasValue(profile.bio) ? <p className="max-w-3xl leading-7">{profile.bio}</p> : null}
              {hasValue(profile.jobs) ? <p className="leading-7">{profile.jobs}</p> : null}
              {hasValue(profile.education) ? <p className="leading-7">{profile.education}</p> : null}
            </div>

            <div className="space-y-2">
              {hasValue(profile.email) ? <p>{profile.email}</p> : null}
              {hasValue(profile.phone) ? <p>{profile.phone}</p> : null}
              {hasValue(profile.address) ? <p className="leading-7">{profile.address}</p> : null}
              {socialLinks.length > 0 ? (
                <div className="flex flex-wrap gap-3 pt-1">
                  {socialLinks.map((item) => (
                    <Link key={item.label} href={item.href as string} target="_blank" className="hover:text-foreground">
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-border/70 pt-4 md:flex-row md:items-center md:justify-between">
          <p className="leading-6">
            {profile?.copyrightText && hasValue(profile.copyrightText)
              ? profile.copyrightText
              : `${platformName} © ${year}`}
          </p>
          <div className="flex items-center gap-5 text-[0.82rem] md:justify-end">
            <Link href="/search" className="hover:text-foreground">Search</Link>
            <Link href="/journals" className="hover:text-foreground">Journals</Link>
            <Link href="/articles" className="hover:text-foreground">Articles</Link>
            <Link href="/projects" className="hover:text-foreground">Projects</Link>
            <Link href="/courses" className="hover:text-foreground">Courses</Link>
            <Link href="/quizzes" className="hover:text-foreground">Quizzes</Link>
          </div>
        </div>
      </SiteContainer>
    </footer>
  );
}

