"use client";

import { GraduationCapIcon, ImageOffIcon, ListChecksIcon } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type GracefulFallbackIconName = "default" | "course" | "quiz";

type GracefulMediaProps = {
  src?: string | null;
  alt: string;
  fallbackLabel?: string;
  fallbackIconName?: GracefulFallbackIconName;
  className?: string;
  imageClassName?: string;
  unoptimized?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
};

export function GracefulMedia({
  src,
  alt,
  fallbackLabel = "Media unavailable",
  fallbackIconName = "default",
  className,
  imageClassName,
  unoptimized = false,
  fill = false,
  width = 1600,
  height = 900,
  sizes,
}: GracefulMediaProps) {
  const [failed, setFailed] = useState(false);
  const fallbackIconMap = {
    default: ImageOffIcon,
    course: GraduationCapIcon,
    quiz: ListChecksIcon,
  } as const;
  const FallbackIcon = fallbackIconMap[fallbackIconName];
  const validSrc = useMemo(
    () => (typeof src === "string" && src.trim().length > 0 ? src.trim() : null),
    [src],
  );
  const shouldRenderImage = Boolean(validSrc) && !failed;

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted/45 text-muted-foreground",
        className,
      )}
    >
      {shouldRenderImage ? (
        <Image
          src={validSrc as string}
          alt={alt}
          {...(fill ? { fill: true } : { width, height })}
          sizes={sizes}
          unoptimized={unoptimized}
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 px-3 text-center">
          <FallbackIcon className="size-5" />
          <span className="text-[0.72rem] uppercase tracking-[0.12em]">{fallbackLabel}</span>
        </div>
      )}
    </div>
  );
}
