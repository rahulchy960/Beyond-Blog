import { requireAdminRouteUser } from "@/server/auth/authorization";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdminRouteUser();
  return children;
}
