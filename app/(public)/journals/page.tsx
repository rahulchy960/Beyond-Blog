import { CONTENT_TYPE } from "@/lib/content/enums";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PublicContentList } from "@/components/content/public-content-list";
import { SiteContainer } from "@/components/layout/site-container";
import { getServerCaller } from "@/server/api/caller";

export default async function JournalsPage() {
  const caller = await getServerCaller();
  const items = await caller.content.listPublished({
    type: CONTENT_TYPE.JOURNAL,
    limit: 40,
  });

  return (
    <div className="py-12 md:py-16">
      <SiteContainer>
        <AnimatedPageWrapper>
          <PublicContentList type={CONTENT_TYPE.JOURNAL} items={items} />
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}
