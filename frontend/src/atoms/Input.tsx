import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Control anclado al borde derecho del campo (mostrar/ocultar, unidades…). */
  trailing?: ReactNode;
}

export default function Input({
  label,
  hint,
  error,
  trailing,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const conTrailing = trailing !== undefined && trailing !== null;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-muted"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-9 w-full rounded-md border bg-surface-2 px-3 text-sm text-text transition-colors",
            "placeholder:text-text-dim",
            "focus:outline-none focus-visible:outline-none",
            conTrailing && "pr-10",
            error
              ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger/40"
              : "border-border hover:border-border-strong focus:border-accent focus:ring-1 focus:ring-accent/40",
            className,
          )}
          {...props}
        />
        {conTrailing && (
          <span className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
            {trailing}
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-danger-soft">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-dim">{hint}</p>
      ) : null}
    </div>
  );
}
