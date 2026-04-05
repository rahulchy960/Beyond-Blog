"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[invalid=true]:text-destructive",
);

function Label({
  className,
  ...props
}: LabelPrimitive.LabelProps & VariantProps<typeof labelVariants>) {
  return (
    <LabelPrimitive.Root
      className={cn(labelVariants(), "peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  );
}

export { Label };
