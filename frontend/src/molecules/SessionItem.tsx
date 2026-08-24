import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/atoms";
import type { Sesion } from "@/api/types.ts";
import { ESTADO_LABELS } from "@/lib/constants.ts";
import { cn } from "@/lib/utils.ts";

interface SessionItemProps {
  sesion: Sesion;
  casoTitulo?: string;
  className?: string;
}

export default function SessionItem({
  sesion,
  casoTitulo,
  className,
}: SessionItemProps) {
  const { pathname } = useLocation();

  const estadoVariant =
    sesion.estado === "en_curso"
      ? "en_curso"
      : sesion.veredicto === "correcto"
        ? "resuelto"
        : "fallido";

  const destino =
    sesion.estado === "en_curso"
      ? `/investigacion/${sesion.id}`
      : `/investigacion/${sesion.id}/informe`;

  const activo = pathname.startsWith(`/investigacion/${sesion.id}`);

  const fecha = new Date(sesion.iniciada).toLocaleDateString("es-GT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      to={destino}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "group relative flex flex-col gap-1 rounded-sm border px-3 py-2 transition-colors duration-150",
        activo
          ? "border-accent/30 bg-accent/8"
          : "border-transparent hover:border-border hover:bg-surface-hover",
        className,
      )}
    >
      {/* Marca lateral de sesion activa */}
      {activo && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-accent" />
      )}
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            activo ? "text-accent-soft" : "text-text",
          )}
        >
          {casoTitulo || sesion.caso}
        </span>
        <Badge variant={estadoVariant}>
          {ESTADO_LABELS[sesion.estado]}
        </Badge>
      </div>
      <span className="text-xs text-text-dim">{fecha}</span>
    </Link>
  );
}
