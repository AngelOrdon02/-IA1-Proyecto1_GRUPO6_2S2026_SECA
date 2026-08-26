import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  FolderOpen,
  History,
  Shuffle,
  Layers,
} from "lucide-react";
import AuraBackground from "@/organisms/AuraBackground.tsx";
import PasosInvestigacion from "@/organisms/PasosInvestigacion.tsx";
import { ChatLayout } from "@/templates";
import { Badge, Button, Spinner, Divider, EmptyState } from "@/atoms";
import { api } from "@/api/client.ts";
import { useSesiones } from "@/hooks";
import type { Caso } from "@/api/types.ts";
import { DIFICULTAD_LABELS, ESTADO_LABELS } from "@/lib/constants.ts";
import heroIlustracion from "@/assets/software tester-pana.png";

/* Hairline superior de la card de caso, teñida segun dificultad: el color
   se percibe antes de leer ninguna etiqueta. */
const LUZ_DIFICULTAD: Record<string, string> = {
  facil: "via-success/70",
  medio: "via-warning/70",
  dificil: "via-danger/70",
};

export default function InicioPage() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  // "aleatorio" es un valor centinela para el estado starting
  const [startingRandom, setStartingRandom] = useState(false);
  const navigate = useNavigate();
  const {
    sesiones,
    titulos,
    loading: loadingSesiones,
    refetch,
  } = useSesiones();

  useEffect(() => {
    api
      .casos()
      .then((data) => {
        setCasos(data.casos);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleStartCase = async (casoId: string) => {
    setStarting(casoId);
    try {
      const res = await api.crearSesion(casoId);
      refetch();
      navigate(`/investigacion/${res.sesion}`);
    } catch {
      setStarting(null);
    }
  };

  // Opcional 1: abre una sesion con un caso elegido al azar por el backend.
  const handleStartRandom = async () => {
    setStartingRandom(true);
    try {
      const res = await api.crearSesionAleatoria();
      refetch();
      navigate(`/investigacion/${res.sesion}`);
    } catch {
      setStartingRandom(false);
    }
  };

  return (
    <AuraBackground>
      <ChatLayout
        sesiones={sesiones}
        titulos={titulos}
        sidebarLoading={loadingSesiones}
        title="Casos"
        subtitle="Elige un expediente para comenzar"
      >
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
            {/* Portada */}
            <header className="mb-12 flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-14">
              <div className="max-w-2xl flex-1">
                <span className="mb-5 inline-flex items-center gap-2 rounded-sm border border-border bg-surface/80 px-3 py-1 text-sm text-text-muted">
                  <Search className="h-4 w-4 text-accent" strokeWidth={1.75} />
                  Sistema experto de investigación
                </span>
                <h1 className="font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl">
                  Resuelve el caso con{" "}
                  <span className="bg-gradient-to-r from-accent-soft to-accent bg-clip-text text-transparent">
                    lógica
                  </span>
                  , no con corazonadas.
                </h1>
                <p className="mt-4 text-base leading-relaxed text-text-muted">
                  Asumes el Rol de Detective: interrogas sospechosos,
                  inspeccionas lugares y examinas evidencias. Cada dato alimenta
                  una base de conocimiento en Prolog que deduce al responsable y
                  explica por qué.
                </p>

                {/* Opcional 1: botón de caso aleatorio */}
                <div className="mt-6">
                  <Button
                    variant="secondary"
                    onClick={handleStartRandom}
                    disabled={startingRandom || starting !== null}
                  >
                    {startingRandom ? (
                      <Spinner size="sm" />
                    ) : (
                      <Shuffle className="h-4 w-4" />
                    )}
                    Caso aleatorio
                  </Button>
                </div>
              </div>

              {/* Ilustracion de portada */}
              <div className="relative mx-auto w-full max-w-md shrink-0 lg:max-w-lg">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(ellipse 62% 55% at 50% 55%, rgba(0,229,255,0.12) 0%, rgba(73,207,158,0.06) 45%, transparent 75%)",
                  }}
                />
                <img
                  src={heroIlustracion}
                  alt="Ilustración de la investigación: una lupa examina el código de una laptop"
                  width={900}
                  height={598}
                  className="w-full animate-fade-up"
                />
              </div>
            </header>

            {/* Como funciona */}
            <PasosInvestigacion />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <Divider label="Casos disponibles" className="flex-1" />
              <div className="flex flex-wrap gap-2">
                <Link to="/historial">
                  <Button variant="ghost" size="sm" className="text-accent-soft hover:text-accent">
                    <History className="h-4 w-4" />
                    Historial
                  </Button>
                </Link>
                {/* Opcional 10: modo multicaso y estadisticas de resolucion. */}
                <Link to="/estadisticas">
                  <Button variant="ghost" size="sm" className="text-accent-soft hover:text-accent">
                    <Layers className="h-4 w-4" />
                    Modo multicaso
                  </Button>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" label="Cargando casos" />
              </div>
            ) : casos.length === 0 ? (
              <EmptyState
                icon={<FolderOpen />}
                message="No hay casos cargados"
                hint="Agrega un caso desde el panel de administración."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {casos.map((caso, i) => (
                  <CasoCard
                    key={caso.Id}
                    caso={caso}
                    numero={i + 1}
                    starting={starting}
                    onStart={handleStartCase}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </ChatLayout>
    </AuraBackground>
  );
}

function CasoCard({
  caso,
  numero,
  starting,
  onStart,
}: {
  caso: Caso;
  numero: number;
  starting: string | null;
  onStart: (id: string) => void;
}) {
  const nuevo = caso.estado === "sin_iniciar";

  return (
    <div
      className="group relative flex animate-fade-up flex-col overflow-hidden rounded-md border border-border bg-surface transition-colors duration-150 hover:border-border-strong hover:bg-surface-2"
      style={{ animationDelay: `${(numero - 1) * 70}ms` }}
    >
      {/* Franja teñida por dificultad */}
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${
          LUZ_DIFICULTAD[caso.Dificultad] ?? "via-border-strong"
        }`}
      />

      <div className="flex flex-1 flex-col gap-4 p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <span className="mt-0.5 font-mono text-xs tracking-[0.06em] text-text-dim uppercase">
            Expediente Nº {String(numero).padStart(2, "0")}
          </span>
          <Badge variant={caso.Dificultad}>
            {DIFICULTAD_LABELS[caso.Dificultad] ?? caso.Dificultad}
          </Badge>
        </div>

        <div className="flex-1">
          <h2 className="font-display text-lg font-semibold leading-snug text-text">
            {caso.Titulo}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            {caso.Descripcion}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-bg-soft/40 px-5 py-4">
        <Badge
          variant={
            caso.estado as "sin_iniciar" | "en_curso" | "resuelto" | "fallido"
          }
        >
          {ESTADO_LABELS[caso.estado] ?? caso.estado}
        </Badge>
        <Button
          variant={nuevo ? "primary" : "secondary"}
          size="sm"
          disabled={starting !== null}
          onClick={() => onStart(caso.Id)}
        >
          {starting === caso.Id ? (
            <Spinner size="sm" />
          ) : (
            <>
              {nuevo ? "Iniciar" : "Continuar"}
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}