import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

type CardTone = "default" | "raised" | "flat";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  interactive?: boolean;
  children: ReactNode;
}

/* Las superficies planas (color uniforme + borde gris) son lo que hace ver
   "generica" una card. Aqui cada tono es un gradiente vertical sutil — la
   luz viene de arriba, como en el fondo aurora — y `shadow-card` aporta la
   hairline superior luminosa que separa la card de su sombra. Siguen siendo
   opacas: el texto nunca se apoya sobre el aura. */
const tones: Record<CardTone, string> = {
  default:
    "bg-gradient-to-b from-surface-2 to-surface border border-border shadow-card",
  raised:
    "bg-gradient-to-b from-surface-3 to-surface-2 border border-border-strong shadow-card",
  flat: "bg-surface-2 border border-transparent",
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
        "rounded-xl p-5",
        tones[tone],
        interactive &&
          "cursor-pointer transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
