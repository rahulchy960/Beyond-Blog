import { cn } from "@/lib/utils";

type SiteContainerProps = React.ComponentProps<"div">;

export function SiteContainer({ className, ...props }: SiteContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[76rem] px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}
