import { CONTENT_TYPE } from "@/lib/content/enums";
import { PublicContentList } from "@/components/content/public-content-list";
import { SiteContainer } from "@/components/layout/site-container";
import { getServerCaller } from "@/server/api/caller";

export default async function ProjectsPage() {
  const caller = await getServerCaller();
  const items = await caller.content.listPublished({
    type: CONTENT_TYPE.PROJECT,
    limit: 40,
  });

  return (
    <div className="py-10 md:py-14">
      <SiteContainer>
        <PublicContentList type={CONTENT_TYPE.PROJECT} items={items} />
      </SiteContainer>
    </div>
  );
}
