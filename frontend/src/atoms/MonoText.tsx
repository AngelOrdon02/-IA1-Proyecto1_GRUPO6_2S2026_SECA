import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

interface MonoTextProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export default function MonoText({
  children,
  className,
  ...props
}: MonoTextProps) {
  return (
    <span
      className={cn(
        "font-mono text-xs tabular-nums tracking-tight text-text-dim",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
