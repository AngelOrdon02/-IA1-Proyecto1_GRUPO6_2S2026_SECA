import type { ComponentProps, ReactNode } from "react";
import MorphIcon from "./MorphIcon.tsx";
import { ICON } from "@/lib/icons.ts";
import { cn } from "@/lib/utils.ts";

type ChipTone = "default" | "danger";
type IconData = ComponentProps<typeof MorphIcon>["icon"];

interface ActionChipProps {
  /** Dato de icono (`ICON.*`), no un componente: el chip lo transforma. */
  icon: IconData;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  tone?: ChipTone;
  badge?: ReactNode;
  title?: string;
  className?: string;
}

/**
 * Boton de accion de la barra inferior.
 *
 * Cuando el chip abre su desplegable, su icono no se sustituye por una X: se
 * *pliega* hasta convertirse en ella y se despliega de vuelta al cerrar. Es
 * el mismo objeto cambiando de estado, que es exactamente lo que ocurre en
 * la interfaz, y hace innecesario cualquier otro indicador de "abierto".
 */
export default function ActionChip({
  icon,
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
        "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors duration-150",
        "disabled:pointer-events-none disabled:opacity-45",
        isDanger
          ? active
            ? "border-danger/60 bg-danger/12 text-danger-soft"
            : "border-danger/30 bg-transparent text-danger-soft hover:border-danger/60 hover:bg-danger/10"
          : active
            ? "border-accent/50 bg-accent/12 text-accent-soft"
            : "border-border bg-surface-2 text-text-muted hover:border-border-strong hover:bg-surface-hover hover:text-text",
        className,
      )}
    >
      <MorphIcon icon={active ? ICON.x : icon} size={15} />
      {label}
      {badge !== undefined && badge !== null && (
        <span
          className={cn(
            "ml-0.5 min-w-4 rounded-xs px-1 text-center text-xs font-medium tabular-nums",
            isDanger
              ? "bg-danger/15 text-danger-soft"
              : "bg-accent/15 text-accent-soft",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
