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
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface/60 px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-3 text-text-dim [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-muted">{message}</p>
        {hint && (
          <p className="max-w-xs text-xs text-text-dim">{hint}</p>
        )}
      </div>
      {action}
    </div>
  );
}
