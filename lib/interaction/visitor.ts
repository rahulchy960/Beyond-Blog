import "server-only";
import { createHash, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const VISITOR_COOKIE_NAME = "bb_guest_v1";
const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function getVisitorHashSecret() {
  return env.INTERACTION_TOKEN_SECRET ?? env.CLERK_SECRET_KEY;
}

export async function getOrCreateVisitorToken() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(VISITOR_COOKIE_NAME)?.value;

  if (existing) {
    return existing;
  }

  const token = randomUUID();

  cookieStore.set(VISITOR_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  return token;
}

export function hashVisitorToken(token: string) {
  const secret = getVisitorHashSecret();
  return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}

export async function getVisitorTokenHash() {
  const token = await getOrCreateVisitorToken();
  return hashVisitorToken(token);
}
