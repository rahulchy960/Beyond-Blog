import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/sonner";
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
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>
          {children}
          <Toaster richColors closeButton />
        </AppProviders>
      </body>
    </html>
  );
}
