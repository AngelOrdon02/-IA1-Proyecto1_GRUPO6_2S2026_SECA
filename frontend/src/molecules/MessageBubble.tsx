import type { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

interface MessageBubbleProps {
  children: ReactNode;
  isUser?: boolean;
  className?: string;
}

export default function MessageBubble({
  children,
  isUser = false,
  className,
}: MessageBubbleProps) {
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-2xl border px-4 py-3",
          isUser
            ? /* Antes era un relleno pleno de acento en cada accion del usuario:
                 demasiado peso visual y texto oscuro sobre color saturado. */
              "max-w-[80%] border-accent/30 bg-accent/12 text-text"
            : "max-w-[92%] border-border bg-surface shadow-sm shadow-black/20",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
