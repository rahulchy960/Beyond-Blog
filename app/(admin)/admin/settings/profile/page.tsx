import { AdminSettingsNav } from "@/components/admin/admin-settings-nav";
import { AdminProfileSettingsForm } from "@/components/admin/admin-profile-settings-form";

export default function AdminProfileSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminSettingsNav current="profile" />
      <AdminProfileSettingsForm />
    </div>
  );
}

