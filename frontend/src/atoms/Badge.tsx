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
 * Etiqueta de estado. Antes era una pastilla con gradiente vertical,
 * mayusculas y tracking amplio: mucho peso para un dato secundario. Ahora es
 * un rectangulo casi recto, tinte plano al 10% y texto en minusculas — se
 * lee igual de rapido y deja de competir con el titulo que acompaña.
 *
 * El color de texto es siempre la version clara del tono (contraste AA sobre
 * el fondo teñido) y el tamaño no baja de `text-xs`, el minimo del tema.
 */
const variants: Record<BadgeVariant, string> = {
  facil: "border-success/25 bg-success/10 text-success-soft",
  medio: "border-warning/25 bg-warning/10 text-warning-soft",
  dificil: "border-danger/25 bg-danger/10 text-danger-soft",
  bajo: "border-success/25 bg-success/10 text-success-soft",
  alto: "border-warning/25 bg-warning/10 text-warning-soft",
  muy_alto: "border-danger/25 bg-danger/10 text-danger-soft",
  sin_iniciar: "border-border-strong bg-surface-3 text-text-muted",
  en_curso: "border-accent/30 bg-accent/10 text-accent-soft",
  resuelto: "border-success/25 bg-success/10 text-success-soft",
  fallido: "border-danger/25 bg-danger/10 text-danger-soft",
  info: "border-info/25 bg-info/10 text-info-soft",
  default: "border-border-strong bg-surface-3 text-text-muted",
};

export default function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
