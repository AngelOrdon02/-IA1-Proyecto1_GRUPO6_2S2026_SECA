import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils.ts";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export default function Input({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

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
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-10 w-full rounded-lg border bg-surface-2 px-3 text-sm text-text transition-colors",
          "placeholder:text-text-dim",
          "focus:outline-none focus-visible:outline-none",
          error
            ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/30"
            : "border-border hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-accent/30",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-danger-soft">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-dim">{hint}</p>
      ) : null}
    </div>
  );
}
