import { cn } from "@/lib/utils.ts";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* Cuadrado de esquina corta en lugar del circulo anterior: en una lista de
   sospechosos, las iniciales dentro de un rectangulo se leen como una ficha
   de expediente, no como un avatar de red social. */
export default function Avatar({
  name,
  size = "md",
  className,
}: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm border border-accent/20 bg-accent/10 font-medium tracking-wide text-accent-soft",
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
