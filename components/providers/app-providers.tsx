import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactQueryProvider } from "@/components/providers/trpc-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ClerkProvider>
      <TRPCReactQueryProvider>{children}</TRPCReactQueryProvider>
    </ClerkProvider>
  );
}
