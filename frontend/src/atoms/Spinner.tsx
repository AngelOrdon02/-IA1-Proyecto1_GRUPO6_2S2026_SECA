import { cn } from "@/lib/utils.ts";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
};

export default function Spinner({
  size = "md",
  label,
  className,
}: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3" role="status">
      <div
        className={cn(
          "animate-spin rounded-full border-accent/25 border-t-accent",
          sizes[size],
          className,
        )}
      />
      {label ? (
        <span className="text-sm text-text-muted">{label}</span>
      ) : (
        <span className="sr-only">Cargando</span>
      )}
    </div>
  );
}
