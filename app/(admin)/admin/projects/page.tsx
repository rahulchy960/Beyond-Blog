import { CONTENT_TYPE } from "@/lib/content/enums";
import { AdminContentListScreen } from "@/components/content/admin-content-list-screen";

export default function AdminProjectsPage() {
  return <AdminContentListScreen type={CONTENT_TYPE.PROJECT} />;
}
