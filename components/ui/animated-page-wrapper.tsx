"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type AnimatedPageWrapperProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function AnimatedPageWrapper({
  children,
  className,
  delay = 0,
}: AnimatedPageWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("will-change-transform", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
