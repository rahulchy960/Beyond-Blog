import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/sign-up",
    title: "Sign-Up Disabled",
    description: "Beyond Blog uses a controlled admin sign-in flow.",
    noIndex: true,
    ogType: "website",
  });
}

export default function SignUpPage() {
  // Beyond Blog is admin allow-list only; sign-up flow is intentionally disabled in-app.
  redirect("/sign-in");
}
