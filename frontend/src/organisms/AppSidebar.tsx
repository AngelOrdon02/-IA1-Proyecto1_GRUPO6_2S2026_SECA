import { Link, useNavigate } from "react-router-dom";
import { Plus, Settings, X, History } from "lucide-react";
import { Button, Spinner } from "@/atoms";
import { BrandLogo, SessionItem } from "@/molecules";
import type { Sesion } from "@/api/types.ts";
import { cn } from "@/lib/utils.ts";

interface AppSidebarProps {
  sesiones: Sesion[];
  /** Id de caso -> titulo, para no listar identificadores crudos. */
  titulos?: Record<string, string>;
  loading?: boolean;
  /** Estado del cajon en pantallas menores a lg. */
  open?: boolean;
  onClose?: () => void;
  /** Repliegue del sidebar en pantallas lg o mayores. */
  collapsed?: boolean;
  className?: string;
}

export default function AppSidebar({
  sesiones,
  titulos = {},
  loading = false,
  open = false,
  onClose,
  collapsed = false,
  className,
}: AppSidebarProps) {
  const navigate = useNavigate();

  const enCurso = sesiones.filter((s) => s.estado === "en_curso");
  const cerradas = sesiones.filter((s) => s.estado !== "en_curso");

  return (
    <>
      {/* Fondo del cajon en movil */}
      {open && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17.5rem] shrink-0 flex-col bg-glass backdrop-blur-xl transition-[width,transform] duration-200",
          /* relative (no static) para que la hairline absoluta se ancle al aside */
          "lg:relative lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          /* Colapsado en desktop: el ancho cae a 0 y el contenido se recorta */
          collapsed && "lg:w-0 lg:overflow-hidden",
          className,
        )}
      >
        {/* Hairline lateral que se desvanece en los extremos */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-border-strong/60 to-transparent"
        />
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
          <Link to="/" className="min-w-0 no-underline">
            <BrandLogo />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="shrink-0 rounded-lg p-2 text-text-dim transition-colors hover:bg-surface-hover hover:text-text lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4">
          <Button variant="primary" block onClick={() => navigate("/")}>
            <Plus className="h-4 w-4" />
            Nueva investigación
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="mb-2 flex items-center justify-between px-2">
            <Link
              to="/historial"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-text-dim transition-colors hover:text-accent-soft"
              title="Abrir historial completo con estadísticas"
            >
              <History className="h-3.5 w-3.5" />
              <span>Historial</span>
            </Link>
            <div className="flex items-center gap-1.5">
              {sesiones.length > 0 && (
                <span className="rounded-full bg-surface-3 px-2 text-xs font-semibold tabular-nums text-text-muted">
                  {sesiones.length}
                </span>
              )}
              <Link
                to="/historial"
                className="text-[11px] font-medium text-accent-soft hover:underline"
              >
                Ver todo
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : sesiones.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-text-dim">
              Todavía no hay investigaciones. Inicia un caso para verlo aquí.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {enCurso.length > 0 && (
                <SessionGroup
                  titulo="En curso"
                  sesiones={enCurso}
                  titulos={titulos}
                />
              )}
              {cerradas.length > 0 && (
                <SessionGroup
                  titulo="Cerradas"
                  sesiones={cerradas}
                  titulos={titulos}
                />
              )}
            </div>
          )}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            to="/admin"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Settings className="h-4 w-4" />
            Administración
          </Link>
        </div>
      </aside>
    </>
  );
}

function SessionGroup({
  titulo,
  sesiones,
  titulos,
}: {
  titulo: string;
  sesiones: Sesion[];
  titulos: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="px-2 pb-1 text-xs font-medium text-text-dim">
        {titulo}
      </span>
      {sesiones.map((s) => (
        <SessionItem key={s.id} sesion={s} casoTitulo={titulos[s.caso]} />
      ))}
    </div>
  );
}
