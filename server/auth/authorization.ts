import "server-only";
import { auth } from "@clerk/nextjs/server";
import type { AdminUser } from "@prisma/client";
import { redirect } from "next/navigation";
import { getAdminByClerkUserId, syncSignedInAdminUser } from "@/server/auth/admin-user";

export async function requireAdminRouteUser(): Promise<AdminUser> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const syncedAdmin = await syncSignedInAdminUser();
  const dbAdmin = syncedAdmin ?? (await getAdminByClerkUserId(userId));

  if (!dbAdmin || !dbAdmin.isActive) {
    redirect("/unauthorized");
  }

  return dbAdmin;
}
