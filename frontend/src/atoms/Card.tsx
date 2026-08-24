import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

type CardTone = "default" | "raised" | "flat";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  interactive?: boolean;
  children: ReactNode;
}

/* Superficies planas y hairline de 1px: la jerarquia entre cards la marca el
   nivel de superficie, no un gradiente ni una sombra. El hover ya no levanta
   la card (ese desplazamiento arrastraba el ojo en cuadriculas densas); solo
   aclara el borde, que es suficiente para leer que es pulsable. */
const tones: Record<CardTone, string> = {
  default: "bg-surface border border-border",
  raised: "bg-surface-2 border border-border-strong",
  flat: "bg-surface-2/60 border border-transparent",
};

export default function Card({
  tone = "default",
  interactive = false,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg p-5",
        tones[tone],
        interactive &&
          "cursor-pointer transition-colors duration-150 hover:border-border-strong hover:bg-surface-hover",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
