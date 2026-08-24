import { Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils.ts";

interface BrandLogoProps {
  size?: "sm" | "md";
  showTagline?: boolean;
  className?: string;
}

export default function BrandLogo({
  size = "sm",
  showTagline = true,
  className,
}: BrandLogoProps) {
  const isMd = size === "md";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-sm border border-accent/20 bg-accent/10 text-accent",
          isMd ? "h-10 w-10" : "h-8 w-8",
        )}
      >
        <Fingerprint className={isMd ? "h-5 w-5" : "h-4 w-4"} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-medium tracking-tight text-text",
            isMd ? "text-base" : "text-sm",
          )}
        >
          Logic Detective
        </p>
        {showTagline && (
          <p className="truncate text-xs text-text-dim">
            Sistema experto en Prolog
          </p>
        )}
      </div>
    </div>
  );
}
