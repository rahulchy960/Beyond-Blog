import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/layout/site-header";
import { AppProviders } from "@/components/providers/app-providers";
import { syncSignedInAdminUser } from "@/server/auth/admin-user";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Beyond Blog",
    template: "%s | Beyond Blog",
  },
  description:
    "Beyond Blog: journals, articles, projects, media, and public quizzes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  if (userId) {
    try {
      await syncSignedInAdminUser();
    } catch (error) {
      console.error("Admin sync failed:", error);
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
