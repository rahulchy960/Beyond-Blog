import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminContext } from "@/lib/auth/admin";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { adminUser, adminProfile } = await requireAdminContext();
  const adminLabel = adminProfile.displayName;
  const adminImageUrl = adminProfile.profileImageId ? null : adminUser.imageUrl;

  return (
    <AdminShell adminLabel={adminLabel} adminImageUrl={adminImageUrl}>
      {children}
    </AdminShell>
  );
}
