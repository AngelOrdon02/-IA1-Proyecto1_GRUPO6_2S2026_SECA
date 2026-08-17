import type { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

type BadgeVariant =
  | "facil"
  | "medio"
  | "dificil"
  | "bajo"
  | "alto"
  | "muy_alto"
  | "sin_iniciar"
  | "en_curso"
  | "resuelto"
  | "fallido"
  | "info"
  | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

/**
 * Etiqueta de estado con lenguaje de "archivo de expediente": esquinas casi
 * rectas, mayusculas con tracking amplio y fondo en gradiente vertical del
 * tono — la luz superior es lo que la separa del look plano generico.
 *
 * Se mantiene el texto en la version clara de cada tono (contraste AA) y
 * el tamano `text-xs` que el tema fija como minimo legible.
 */
const variants: Record<BadgeVariant, string> = {
  facil:
    "border-success/35 bg-gradient-to-b from-success/15 to-success/5 text-success-soft",
  medio:
    "border-warning/35 bg-gradient-to-b from-warning/15 to-warning/5 text-warning-soft",
  dificil:
    "border-danger/35 bg-gradient-to-b from-danger/15 to-danger/5 text-danger-soft",
  bajo: "border-success/35 bg-gradient-to-b from-success/15 to-success/5 text-success-soft",
  alto: "border-warning/35 bg-gradient-to-b from-warning/15 to-warning/5 text-warning-soft",
  muy_alto:
    "border-danger/35 bg-gradient-to-b from-danger/15 to-danger/5 text-danger-soft",
  sin_iniciar:
    "border-border-strong bg-gradient-to-b from-surface-3 to-surface-2 text-text-muted",
  en_curso:
    "border-accent/40 bg-gradient-to-b from-accent/18 to-accent/6 text-accent-soft",
  resuelto:
    "border-success/35 bg-gradient-to-b from-success/15 to-success/5 text-success-soft",
  fallido:
    "border-danger/35 bg-gradient-to-b from-danger/15 to-danger/5 text-danger-soft",
  info: "border-info/35 bg-gradient-to-b from-info/15 to-info/5 text-info-soft",
  default:
    "border-border-strong bg-gradient-to-b from-surface-3 to-surface-2 text-text-muted",
};

export default function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em]",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
