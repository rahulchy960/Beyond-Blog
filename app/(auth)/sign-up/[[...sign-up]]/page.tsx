import { redirect } from "next/navigation";

export default function SignUpPage() {
  // Beyond Blog is single-admin only; sign-up flow is intentionally disabled in-app.
  redirect("/sign-in");
}
