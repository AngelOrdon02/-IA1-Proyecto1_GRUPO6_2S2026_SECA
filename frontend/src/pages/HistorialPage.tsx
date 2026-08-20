import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ArrowLeft,
  FileText,
  Play,
  Printer,
  Sparkles,
  Award,
  Layers,
} from "lucide-react";
import AuraBackground from "@/organisms/AuraBackground.tsx";
import { ChatLayout } from "@/templates";
import {
  Badge,
  Button,
  Select,
  Spinner,
  EmptyState,
  MonoText,
} from "@/atoms";
import { api } from "@/api/client.ts";
import { useSesiones } from "@/hooks";
import type { HistorialSesion, HistorialEstadisticas } from "@/api/types.ts";
import { DIFICULTAD_LABELS, ESTADO_LABELS } from "@/lib/constants.ts";

export default function HistorialPage() {
  const { sesiones: sidebarSesiones, titulos, loading: loadingSidebar } = useSesiones();

  const [sesiones, setSesiones] = useState<HistorialSesion[]>([]);
  const [estadisticas, setEstadisticas] = useState<HistorialEstadisticas | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroCaso, setFiltroCaso] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const params: { caso?: string; veredicto?: string; estado?: string } = {};
      if (filtroCaso !== "todos") params.caso = filtroCaso;
      if (filtroEstado === "resuelto") params.veredicto = "correcto";
      else if (filtroEstado === "fallido") params.veredicto = "incorrecto";
      else if (filtroEstado === "en_curso") params.estado = "en_curso";

      const res = await api.historial(params);
      setSesiones(res.sesiones);
      setEstadisticas(res.estadisticas);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [filtroCaso, filtroEstado]);

  const sesionesFiltradas = useMemo(() => {
    if (!busqueda.trim()) return sesiones;
    const q = busqueda.toLowerCase();
    return sesiones.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.caso_titulo.toLowerCase().includes(q) ||
        s.caso.toLowerCase().includes(q) ||
        (s.nombre_acusado && s.nombre_acusado.toLowerCase().includes(q)) ||
        s.responsable_real.toLowerCase().includes(q),
    );
  }, [sesiones, busqueda]);

  return (
    <AuraBackground>
      <ChatLayout
        sesiones={sidebarSesiones}
        titulos={titulos}
        sidebarLoading={loadingSidebar}
        title="Historial"
        subtitle="Registro histórico de investigaciones y estadísticas"
      >
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
            {/* Cabecera y botón de regreso */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a la selección de casos
              </Link>
            </div>

            <header className="mb-8">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/25 bg-accent/12 text-accent">
                  <History className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                    Historial de Investigaciones
                  </h1>
                  <p className="mt-1 text-sm text-text-muted">
                    Consulta expedientes resueltos, analiza tu tasa de aciertos y revisa informes anteriores.
                  </p>
                </div>
              </div>
            </header>

            {/* Tarjetas de Métricas y Estadísticas Globales */}
            {estadisticas && (
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={Layers}
                  label="Total de Investigaciones"
                  value={estadisticas.total}
                  detail={`${estadisticas.en_curso} en curso`}
                  color="text-accent"
                />
                <MetricCard
                  icon={Award}
                  label="Tasa de Éxito"
                  value={`${estadisticas.tasa_exito}%`}
                  detail={`${estadisticas.resueltas} de ${estadisticas.resueltas + estadisticas.fallidas} cerradas`}
                  color="text-success"
                />
                <MetricCard
                  icon={CheckCircle2}
                  label="Resueltas con Éxito"
                  value={estadisticas.resueltas}
                  detail={`${estadisticas.fallidas} fallidas`}
                  color="text-info"
                />
                <MetricCard
                  icon={Sparkles}
                  label="Promedio de Pistas"
                  value={estadisticas.promedio_pistas}
                  detail="por investigación"
                  color="text-warning"
                />
              </div>
            )}

            {/* Barra de Filtros y Búsqueda */}
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
              <div className="min-w-[16rem] flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-dim" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por caso, sospechoso o ID..."
                    className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-text placeholder-text-dim focus:border-accent focus:outline-none"
                  />
                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => setBusqueda("")}
                      className="absolute right-2.5 top-2.5 text-xs text-text-dim hover:text-text"
                    >
                      X
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={filtroCaso}
                  onChange={(e) => setFiltroCaso(e.target.value)}
                  options={[
                    { value: "todos", label: "Todos los casos" },
                    { value: "caso1", label: "Caso 1 (Museo)" },
                    { value: "caso2", label: "Caso 2 (Hospital)" },
                    { value: "caso3", label: "Caso 3 (Corporativo)" },
                  ]}
                  className="w-44 text-xs"
                />

                <Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  options={[
                    { value: "todos", label: "Todos los estados" },
                    { value: "resuelto", label: "Resuelto (Correcto)" },
                    { value: "fallido", label: "Fallido (Incorrecto)" },
                    { value: "en_curso", label: "En curso" },
                  ]}
                  className="w-48 text-xs"
                />
              </div>
            </div>

            {/* Listado de Sesiones */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" label="Cargando historial" />
              </div>
            ) : sesionesFiltradas.length === 0 ? (
              <EmptyState
                icon={<History />}
                message="No se encontraron investigaciones"
                hint="Prueba cambiando los filtros o inicia un nuevo caso."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setFiltroCaso("todos");
                      setFiltroEstado("todos");
                      setBusqueda("");
                    }}
                  >
                    Restablecer filtros
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {sesionesFiltradas.map((s) => (
                  <SesionCard key={s.id} sesion={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      </ChatLayout>
    </AuraBackground>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  color,
}: {
  icon: typeof History;
  label: string;
  value: string | number;
  detail: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-b from-surface-2 to-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-dim">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-text">{value}</div>
      <p className="mt-0.5 text-xs text-text-muted">{detail}</p>
    </div>
  );
}

function SesionCard({ sesion: s }: { sesion: HistorialSesion }) {
  const isCorrect = s.veredicto === "correcto";
  const isClosed = s.estado !== "en_curso";

  return (
    <div className="group rounded-xl border border-border bg-surface p-4 transition-all duration-150 hover:border-border-strong hover:bg-surface-hover">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-text">{s.caso_titulo}</span>
            <Badge variant={s.caso_dificultad}>
              {DIFICULTAD_LABELS[s.caso_dificultad] ?? s.caso_dificultad}
            </Badge>
            <Badge variant={s.estado as "en_curso" | "resuelto" | "fallido"}>
              {ESTADO_LABELS[s.estado] ?? s.estado}
            </Badge>
            <MonoText className="text-text-dim">ID: {s.id}</MonoText>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-text-dim" />
              {new Date(s.iniciada).toLocaleString("es-GT", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
            {s.duracion_texto !== "-" && (
              <span>Duración: <strong>{s.duracion_texto}</strong></span>
            )}
            <span>Pistas usadas: <strong>{s.pistas}</strong></span>
            <span>Acciones: <strong>{s.total_acciones}</strong></span>
          </div>

          {/* Detalle de la acusación si la sesión está cerrada */}
          {isClosed && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-text-dim">Acusado:</span>
              <span className="font-medium text-text">{s.nombre_acusado ?? s.acusado}</span>
              <span className="text-text-dim">· Culpable real:</span>
              <span className="font-medium text-text">{s.responsable_real}</span>
              {isCorrect ? (
                <span className="inline-flex items-center gap-1 font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Acertado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-danger">
                  <XCircle className="h-3.5 w-3.5" /> Fallido
                </span>
              )}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isClosed ? (
            <>
              <Link to={`/investigacion/${s.id}/informe`}>
                <Button variant="primary" size="sm">
                  <FileText className="h-4 w-4" />
                  Ver Informe
                </Button>
              </Link>
              <a
                href={`/api/sesiones/${s.id}/informe/imprimir`}
                target="_blank"
                rel="noreferrer"
                title="Imprimir / Exportar a PDF"
              >
                <Button variant="ghost" size="sm">
                  <Printer className="h-4 w-4" />
                  PDF
                </Button>
              </a>
            </>
          ) : (
            <Link to={`/investigacion/${s.id}`}>
              <Button variant="primary" size="sm">
                <Play className="h-4 w-4" />
                Continuar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
