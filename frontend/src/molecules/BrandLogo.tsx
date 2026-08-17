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
          "flex shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/12 text-accent",
          isMd ? "h-12 w-12" : "h-10 w-10",
        )}
      >
        <Fingerprint className={isMd ? "h-6 w-6" : "h-5 w-5"} />
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-semibold tracking-tight text-text",
            isMd ? "text-lg" : "text-base",
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
