import "server-only";
import { auth } from "@clerk/nextjs/server";
import { Role, type User } from "@prisma/client";
import { redirect } from "next/navigation";
import { getDatabaseUserByClerkId, syncCurrentUser } from "@/server/auth/sync-user";

export async function requireAdminRouteUser(): Promise<User> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const syncedUser = await syncCurrentUser();
  const dbUser = syncedUser ?? (await getDatabaseUserByClerkId(userId));

  if (!dbUser || dbUser.role !== Role.ADMIN) {
    redirect("/unauthorized");
  }

  return dbUser;
}
