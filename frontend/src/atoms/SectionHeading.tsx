import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

interface SectionHeadingProps {
  icon?: LucideIcon;
  title: string;
  count?: number;
  action?: ReactNode;
  className?: string;
}

/* El icono ya no vive dentro de una caja teñida de 36px: a ese tamaño la
   caja pesaba mas que el titulo. Ahora es el icono suelto en el acento. */
export default function SectionHeading({
  icon: Icon,
  title,
  count,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-4 flex items-center gap-2.5", className)}>
      {Icon && (
        <Icon className="h-[18px] w-[18px] shrink-0 text-accent" strokeWidth={1.75} />
      )}
      <h2 className="text-base font-medium tracking-tight text-text">{title}</h2>
      {count !== undefined && (
        <span className="rounded-xs bg-surface-3 px-1.5 text-xs tabular-nums text-text-muted">
          {count}
        </span>
      )}
      <div className="ml-auto flex items-center gap-2">{action}</div>
    </div>
  );
}
