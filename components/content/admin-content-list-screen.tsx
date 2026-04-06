import { type ContentType } from "@/lib/content/enums";
import { ContentListTable } from "@/components/content/content-list-table";

type AdminContentListScreenProps = {
  type: ContentType;
};

export function AdminContentListScreen({ type }: AdminContentListScreenProps) {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <ContentListTable type={type} />
    </div>
  );
}
