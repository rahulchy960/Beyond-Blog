import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactQueryProvider } from "@/components/providers/trpc-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ClerkProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TRPCReactQueryProvider>{children}</TRPCReactQueryProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
