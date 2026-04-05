import "server-only";
import { createHash, randomUUID } from "crypto";
import { z } from "zod";

const visitorTokenSchema = z.string().trim().min(16).max(256);

export function createGuestVisitorToken(): string {
  return randomUUID();
}

export function hashVisitorToken(rawToken: string): string {
  const token = visitorTokenSchema.parse(rawToken);
  return createHash("sha256").update(token).digest("hex");
}
