import { CONTENT_TYPE } from "@/lib/content/enums";
import { AdminContentListScreen } from "@/components/content/admin-content-list-screen";

export default function AdminArticlesPage() {
  return <AdminContentListScreen type={CONTENT_TYPE.ARTICLE} />;
}
