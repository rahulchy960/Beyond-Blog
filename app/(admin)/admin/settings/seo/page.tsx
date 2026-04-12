import { AdminSeoSettingsForm } from "@/components/admin/admin-seo-settings-form";
import { AdminSettingsNav } from "@/components/admin/admin-settings-nav";

export default function AdminSeoSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminSettingsNav current="seo" />
      <AdminSeoSettingsForm />
    </div>
  );
}
