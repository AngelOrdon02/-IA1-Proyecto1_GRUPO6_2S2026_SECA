import type { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export default function GlassPanel({
  children,
  className,
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-glass backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
