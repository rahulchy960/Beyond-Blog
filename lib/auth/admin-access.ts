export function getAllowedAdminIds(): string[] {
  const raw = process.env.ALLOWED_ADMIN_IDS ?? process.env.SINGLE_ADMIN_CLERK_USER_ID ?? "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function isAllowedAdmin(userId: string): boolean {
  return getAllowedAdminIds().includes(userId);
}
