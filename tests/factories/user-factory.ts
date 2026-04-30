let userCounter = 1;

export function userFactory(overrides: Partial<{
  id: string;
  clerkUserId: string;
  email: string;
  isActive: boolean;
  role: "OWNER";
}> = {}) {
  const index = userCounter++;
  return {
    id: overrides.id ?? `admin_${index}`,
    clerkUserId: overrides.clerkUserId ?? `user_${index}`,
    email: overrides.email ?? `admin${index}@example.com`,
    isActive: overrides.isActive ?? true,
    role: overrides.role ?? "OWNER",
  };
}
