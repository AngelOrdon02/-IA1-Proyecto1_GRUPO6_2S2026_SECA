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

/* Rellenos planos. Los gradientes verticales y la hairline blanca interna
   daban a cada boton un relieve de "boton fisico" que, repetido por toda la
   pantalla, es justo lo que hacia pesada la interfaz. Ahora el peso lo lleva
   solo el color: un unico primario esmeralda pleno, el resto en superficie
   con borde. El hover cambia el color, no el brillo. */
const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink font-medium hover:bg-accent-soft active:bg-accent",
  secondary:
    "bg-surface-2 text-text border border-border hover:border-border-strong hover:bg-surface-hover",
  ghost:
    "bg-transparent text-text-muted hover:bg-surface-hover hover:text-text",
  danger:
    "bg-danger text-accent-ink font-medium hover:bg-danger-soft active:bg-danger",
  accent:
    "bg-success text-accent-ink font-medium hover:bg-success-soft active:bg-success",
};

/* Alturas de 32/36/40px: mas compactas que antes, que es lo que hace que una
   herramienta se lea como herramienta, sin bajar del area tactil minima. */
const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-10 px-4 text-sm gap-2",
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
        "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md transition-colors duration-150 select-none",
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
