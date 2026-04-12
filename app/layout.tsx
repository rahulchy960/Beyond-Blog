import type { Metadata } from "next";
import { Lora, Plus_Jakarta_Sans, Roboto_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/sonner";
import { buildBaseMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--app-font-sans",
  display: "swap",
});

const heading = Lora({
  subsets: ["latin"],
  variable: "--app-font-heading",
  display: "swap",
});

const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--app-font-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  return buildBaseMetadata();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${heading.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
        <AppProviders>
          {children}
          <Toaster richColors closeButton />
        </AppProviders>
      </body>
    </html>
  );
}
