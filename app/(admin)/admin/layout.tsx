import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const admin = await requireAdmin();
  const adminLabel =
    `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim() || admin.email;

  return (
    <AdminShell adminLabel={adminLabel} adminImageUrl={admin.imageUrl}>
      {children}
    </AdminShell>
  );
}
