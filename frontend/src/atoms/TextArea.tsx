import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils.ts";

interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export default function TextArea({
  label,
  hint,
  className,
  id,
  ...props
}: TextAreaProps) {
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
      <textarea
        id={inputId}
        rows={props.rows ?? 3}
        className={cn(
          "w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 text-sm leading-relaxed text-text transition-colors",
          "placeholder:text-text-dim hover:border-border-strong",
          "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40 focus-visible:outline-none",
          className,
        )}
        {...props}
      />
      {hint && <p className="text-xs text-text-dim">{hint}</p>}
    </div>
  );
}
