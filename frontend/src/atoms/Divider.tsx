import type { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

interface DividerProps {
  className?: string;
  vertical?: boolean;
  label?: ReactNode;
}

/* Hairlines que se desvanecen hacia los extremos: una linea de corte neto
   en medio de superficies oscuras grita "default"; el fundido la integra. */
const fade =
  "bg-gradient-to-r from-transparent via-border-strong/70 to-transparent";

export default function Divider({
  className,
  vertical = false,
  label,
}: DividerProps) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <span className={cn("h-px flex-1", fade)} />
        <span className="text-xs font-medium tracking-[0.06em] text-text-dim uppercase">
          {label}
        </span>
        <span className={cn("h-px flex-1", fade)} />
      </div>
    );
  }

  return (
    <div
      role="separator"
      className={cn(
        vertical ? "h-full w-px bg-border" : cn("h-px w-full", fade),
        className,
      )}
    />
  );
}
