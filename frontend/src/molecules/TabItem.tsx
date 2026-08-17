import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

interface TabItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

/**
 * Pestaña horizontal. Antes era una fila de un rail vertical de 176px que se
 * comia mas de la mitad del panel del expediente.
 */
export default function TabItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: TabItemProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-colors duration-150",
        active
          ? "border-accent/35 bg-accent/12 font-semibold text-accent-soft"
          : "border-transparent text-text-muted hover:bg-surface-hover hover:text-text",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "min-w-5 rounded-full px-1.5 text-center text-xs font-semibold tabular-nums",
            active ? "bg-accent/20 text-accent-soft" : "bg-surface-3 text-text-muted",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
