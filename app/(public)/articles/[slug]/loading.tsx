import { SiteContainer } from "@/components/layout/site-container";
import { DetailPageSkeleton } from "@/components/ui/loading-skeletons";

export default function ArticleDetailLoading() {
  return (
    <SiteContainer>
      <DetailPageSkeleton />
    </SiteContainer>
  );
}
