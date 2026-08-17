import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

interface SectionHeadingProps {
  icon?: LucideIcon;
  title: string;
  count?: number;
  action?: ReactNode;
  className?: string;
}

export default function SectionHeading({
  icon: Icon,
  title,
  count,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-4 flex items-center gap-3", className)}>
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-semibold tabular-nums text-text-muted">
          {count}
        </span>
      )}
      <div className="ml-auto flex items-center gap-2">{action}</div>
    </div>
  );
}
