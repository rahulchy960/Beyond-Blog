import { type ReactNode } from "react";
import { SectionHeader } from "@/components/ui/section-header";

type DiscoverySectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DiscoverySection({
  eyebrow,
  title,
  description,
  actions,
  children,
}: DiscoverySectionProps) {
  return (
    <section className="space-y-5">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
        className="border-b border-border/70 pb-4"
      />
      {children}
    </section>
  );
}

