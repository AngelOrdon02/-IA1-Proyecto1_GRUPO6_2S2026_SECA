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
 * Pestaña horizontal. La activa se marca con una linea inferior en el acento
 * en vez de una pastilla rellena: es el patron que menos ruido introduce
 * cuando hay cinco o seis pestañas seguidas.
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
        "relative inline-flex h-9 shrink-0 items-center gap-2 px-2.5 text-sm transition-colors duration-150",
        active
          ? "font-medium text-text"
          : "text-text-dim hover:text-text-muted",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      <span className="whitespace-nowrap">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "min-w-4 rounded-xs px-1 text-center text-xs tabular-nums",
            active ? "bg-accent/15 text-accent-soft" : "bg-surface-3 text-text-dim",
          )}
        >
          {badge}
        </span>
      )}
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
        />
      )}
    </button>
  );
}
