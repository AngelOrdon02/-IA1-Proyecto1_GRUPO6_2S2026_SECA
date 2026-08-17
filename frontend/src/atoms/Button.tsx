import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "accent";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  children: ReactNode;
}

/* El primario es la unica pieza con relleno de color en la UI: gradiente de
   laton (luz de arriba) y hairline interna. Sin glow difuso: las sombras
   borrosas alrededor del boton se perciben como suciedad, no como luz.
   El hover sube brillo en vez de cambiar el color, asi el gradiente no se
   aplana. */
const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-accent-soft to-accent text-accent-ink font-semibold shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] hover:brightness-108 active:brightness-95",
  secondary:
    "bg-gradient-to-b from-surface-3 to-surface-2 text-text border border-border-strong shadow-card hover:border-border-strong hover:brightness-125",
  ghost:
    "bg-transparent text-text-muted border border-border hover:bg-surface-hover hover:text-text hover:border-border-strong",
  danger:
    "bg-danger text-accent-ink font-semibold shadow-[0_1px_0_rgba(255,255,255,0.22)_inset] hover:brightness-110 active:brightness-95",
  accent:
    "bg-success text-accent-ink font-semibold shadow-[0_1px_0_rgba(255,255,255,0.22)_inset] hover:brightness-110 active:brightness-95",
};

/* Alturas minimas de 36/40/44px: los botones anteriores quedaban por debajo
   del area tactil recomendada. */
const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  block = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-lg transition-[background-color,border-color,filter,transform] duration-150 select-none",
        "disabled:pointer-events-none disabled:opacity-45",
        "[&>svg]:shrink-0",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
