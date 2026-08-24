import type { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

interface MessageBubbleProps {
  children: ReactNode;
  isUser?: boolean;
  className?: string;
}

/* Esquina corta en lugar de la burbuja de 16px: el hilo pasa a leerse como
   una bitacora de expediente y no como una app de mensajeria. La accion del
   detective se distingue por el tinte del acento, no por el radio. */
export default function MessageBubble({
  children,
  isUser = false,
  className,
}: MessageBubbleProps) {
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-md border px-4 py-3",
          isUser
            ? "max-w-[80%] border-accent/25 bg-accent/8 text-text"
            : "max-w-[92%] border-border bg-surface",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
