import Link from "next/link";
import { getPublicServerCaller } from "@/server/api/caller";
import { platformName } from "@/lib/constants";
import { SiteContainer } from "@/components/layout/site-container";

function hasValue(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true" fill="currentColor">
      <path d="M12 .5A12 12 0 0 0 8.2 23.9c.6.1.8-.2.8-.6v-2.2c-3.3.7-4-1.5-4-1.5-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.7-2.7-.3-5.5-1.4-5.5-6A4.6 4.6 0 0 1 5.5 8c-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1a4.6 4.6 0 0 1 1.2 3.2c0 4.6-2.8 5.7-5.5 6 .4.3.8 1 .8 2v3c0 .4.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true" fill="currentColor">
      <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm8.2 2H8a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4Zm-4 3.2A4.8 4.8 0 1 1 7.2 12 4.8 4.8 0 0 1 12 7.2Zm0 1.8a3 3 0 1 0 3 3 3 3 0 0 0-3-3Zm5.2-2.2a1.2 1.2 0 1 1-1.2 1.2 1.2 1.2 0 0 1 1.2-1.2Z" />
    </svg>
  );
}

export async function PublicFooter() {
  const year = new Date().getFullYear();
  const caller = await getPublicServerCaller();
  const profile = await caller.profile.getPublicFooterProfile().catch(() => null);

  const copyrightLabel =
    profile?.copyrightText && hasValue(profile.copyrightText)
      ? profile.copyrightText
      : `${platformName} © ${year}`;

  const socialLinks = [
    { label: "LinkedIn", href: profile?.linkedinUrl },
    { label: "GitHub", href: profile?.githubUrl },
    { label: "Twitter", href: profile?.twitterUrl },
    { label: "Website", href: profile?.websiteUrl },
  ].filter((item) => hasValue(item.href));

  const developerLinks = [
    {
      label: "GitHub",
      href: "https://github.com/rahulchy960",
      icon: <GithubMark />,
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/__instinct_is_a_lie__/",
      icon: <InstagramMark />,
    },
  ];

  return (
    <footer className="border-t border-border/70 bg-surface-soft/40">
      <SiteContainer className="space-y-7 py-8 text-sm text-muted-foreground">
        {profile ? (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-3">
              {hasValue(profile.displayName) ? (
                <Link href={`/authors/${profile.slug}`} className="text-base font-semibold text-foreground hover:text-primary">
                  {profile.displayName}
                </Link>
              ) : null}
              {hasValue(profile.designation) ? <p>{profile.designation}</p> : null}
              {hasValue(profile.bio) ? <p className="max-w-3xl leading-7">{profile.bio}</p> : null}
              {hasValue(profile.experience) ? <p className="leading-7">{profile.experience}</p> : null}
              {hasValue(profile.education) ? <p className="leading-7">{profile.education}</p> : null}
            </div>

            <div className="space-y-2">
              {hasValue(profile.email) ? <p>{profile.email}</p> : null}
              {hasValue(profile.phone) ? <p>{profile.phone}</p> : null}
              {hasValue(profile.address) ? <p className="leading-7">{profile.address}</p> : null}
              {socialLinks.length > 0 ? (
                <div className="flex flex-wrap gap-3 pt-1">
                  {socialLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href as string}
                      target="_blank"
                      className="hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-4 border-t border-border/70 pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="leading-6">{copyrightLabel}</p>

            <div className="flex flex-wrap items-center gap-5 text-[0.82rem] md:justify-end">
              <Link href="/search" className="hover:text-foreground">
                Search
              </Link>
              <Link href="/journals" className="hover:text-foreground">
                Journals
              </Link>
              <Link href="/articles" className="hover:text-foreground">
                Articles
              </Link>
              <Link href="/projects" className="hover:text-foreground">
                Projects
              </Link>
              <Link href="/courses" className="hover:text-foreground">
                Courses
              </Link>
              <Link href="/authors" className="hover:text-foreground">
                Authors
              </Link>
              <Link href="/quizzes" className="hover:text-foreground">
                Quizzes
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <span className="text-xs leading-5">Developed By <span className="m-0.5 text-primary">Rahul Chowdhury</span> </span>
            <div className="flex items-center gap-2">
              {developerLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Rahul Chowdhury ${item.label}`}
                  className="inline-flex size-7 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:text-primary"
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </SiteContainer>
    </footer>
  );
}
