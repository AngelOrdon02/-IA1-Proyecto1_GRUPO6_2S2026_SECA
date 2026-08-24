import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  message: string;
  hint?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  message,
  hint,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-surface/40 px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="text-text-dim [&>svg]:h-6 [&>svg]:w-6 [&>svg]:stroke-[1.5]">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm text-text-muted">{message}</p>
        {hint && (
          <p className="max-w-xs text-xs text-text-dim">{hint}</p>
        )}
      </div>
      {action}
    </div>
  );
}
