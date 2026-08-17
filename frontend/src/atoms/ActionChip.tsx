import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type ChipTone = "default" | "danger";

interface ActionChipProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  tone?: ChipTone;
  badge?: ReactNode;
  title?: string;
  className?: string;
}

export default function ActionChip({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  active = false,
  tone = "default",
  badge,
  title,
  className,
}: ActionChipProps) {
  const isDanger = tone === "danger";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-expanded={active}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors duration-150",
        "disabled:pointer-events-none disabled:opacity-45",
        isDanger
          ? active
            ? "border-danger bg-danger/15 text-danger-soft"
            : "border-danger/40 bg-danger/8 text-danger-soft hover:border-danger hover:bg-danger/15"
          : active
            ? "border-accent bg-accent/15 text-accent-soft"
            : "border-border bg-surface-2 text-text hover:border-border-strong hover:bg-surface-hover",
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
      {badge !== undefined && badge !== null && (
        <span
          className={cn(
            "ml-0.5 min-w-5 rounded-full px-1.5 py-px text-center text-xs font-semibold tabular-nums",
            isDanger
              ? "bg-danger/20 text-danger-soft"
              : "bg-accent/18 text-accent-soft",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
