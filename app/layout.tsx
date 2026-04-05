import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/layout/site-header";
import { AppProviders } from "@/components/providers/app-providers";
import { syncCurrentUser } from "@/server/auth/sync-user";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Professor Academic Platform",
    template: "%s | Professor Academic Platform",
  },
  description:
    "Production-ready academic content platform foundation for journals, projects, articles, media, and quizzes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  if (userId) {
    try {
      await syncCurrentUser();
    } catch (error) {
      console.error("User sync failed:", error);
    }
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
