"use client";

import { motion } from "motion/react";
import { HeartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  liked: boolean;
  likesCount: number;
  isPending?: boolean;
  onToggle: () => void;
};

export function LikeButton({ liked, likesCount, isPending, onToggle }: LikeButtonProps) {
  return (
    <Button
      type="button"
      variant={liked ? "default" : "outline"}
      size="sm"
      className={cn("gap-2 rounded-full px-3.5", liked && "shadow-sm")}
      disabled={Boolean(isPending)}
      onClick={onToggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this post" : "Like this post"}
    >
      <motion.span
        key={liked ? "liked" : "idle"}
        initial={{ scale: 0.84, rotate: liked ? -8 : 0, opacity: 0.7 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="inline-flex items-center"
      >
        <HeartIcon className={cn("size-4", liked && "fill-current")} />
      </motion.span>
      <span className="text-[0.82rem]">
        {likesCount} {likesCount === 1 ? "Like" : "Likes"}
      </span>
    </Button>
  );
}
