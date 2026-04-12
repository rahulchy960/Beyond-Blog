import { SiteContainer } from "@/components/layout/site-container";
import {
  DiscoveryListSkeleton,
  PageShellSkeleton,
} from "@/components/ui/loading-skeletons";

export default function PublicRoutesLoading() {
  return (
    <div className="py-10 md:py-14">
      <SiteContainer className="space-y-8">
        <PageShellSkeleton />
        <DiscoveryListSkeleton rows={5} />
      </SiteContainer>
    </div>
  );
}
