import { cn } from "@/lib/utils.ts";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({
  name,
  size = "md",
  className,
}: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/12 font-semibold text-accent-soft",
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
