import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils.ts";

interface ActionPopoverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  hint?: string;
  align?: "left" | "right";
  children: ReactNode;
  className?: string;
}

export default function ActionPopover({
  open,
  onClose,
  title,
  hint,
  align = "left",
  children,
  className,
}: ActionPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      className={cn(
        "absolute bottom-full z-40 mb-3 w-80 animate-scale-in rounded-xl border border-border-strong bg-surface-2 shadow-2xl shadow-black/60",
        align === "right" ? "right-0" : "left-0",
        /* En movil se ancla al viewport: anclado al chip se salia por la
           derecha cuando el chip no era el primero de su fila. */
        "max-sm:fixed max-sm:inset-x-4 max-sm:bottom-28 max-sm:mb-0 max-sm:w-auto",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-text">{title}</h4>
          {hint && <p className="mt-0.5 text-xs text-text-dim">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-text-dim transition-colors hover:bg-surface-hover hover:text-text"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">{children}</div>
    </div>
  );
}
