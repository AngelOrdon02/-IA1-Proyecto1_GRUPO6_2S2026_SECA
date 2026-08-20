import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  MessageSquare,
  MapPin,
  Scale,
  ArrowRight,
  FolderOpen,
  History,
} from "lucide-react";
import AuraBackground from "@/organisms/AuraBackground.tsx";
import { ChatLayout } from "@/templates";
import { Badge, Button, Spinner, Divider, EmptyState } from "@/atoms";
import { api } from "@/api/client.ts";
import { useSesiones } from "@/hooks";
import type { Caso } from "@/api/types.ts";
import { DIFICULTAD_LABELS, ESTADO_LABELS } from "@/lib/constants.ts";
import heroIlustracion from "@/assets/software tester-pana.png";

const PASOS = [
  {
    icon: MessageSquare,
    titulo: "Interroga",
    texto: "Cada declaración y coartada entra a la base de conocimiento.",
  },
  {
    icon: MapPin,
    titulo: "Recorre y examina",
    texto: "Los lugares revelan evidencias que se vinculan con personas.",
  },
  {
    icon: Scale,
    titulo: "Acusa",
    texto: "Prolog contrasta tu acusación con el responsable deducido.",
  },
];

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
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-sm text-text-muted">
                  <Search className="h-4 w-4 text-accent" />
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
                  Asumes el rol de detective: interrogas sospechosos,
                  inspeccionas lugares y examinas evidencias. Cada dato alimenta
                  una base de conocimiento en Prolog que deduce al responsable y
                  explica por qué.
                </p>
              </div>

              {/* Ilustracion de portada: un halo teal la asienta sobre el aura
                  en lugar de dejarla flotando suelta */}
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
            <div className="mb-12 grid gap-3 sm:grid-cols-3">
              {PASOS.map((paso, i) => (
                <div
                  key={paso.titulo}
                  className="rounded-xl border border-border bg-gradient-to-b from-surface-2 to-surface p-4 shadow-card"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-gradient-to-b from-accent/20 to-accent/8 text-accent">
                      <paso.icon className="h-4 w-4" />
                    </span>
                    <span className="font-mono text-xs text-text-dim">
                      0{i + 1}
                    </span>
                  </div>
                  <p className="font-semibold text-text">{paso.titulo}</p>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    {paso.texto}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <Divider label="Casos disponibles" className="flex-1" />
              <Link to="/historial">
                <Button variant="ghost" size="sm" className="text-accent-soft hover:text-accent">
                  <History className="h-4 w-4" />
                  Ver Historial y Estadísticas
                </Button>
              </Link>
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
    /* No usa el atomo Card: la estructura con franja interna necesita control
       total del padding, y `cn` (join simple) no resolveria el conflicto con
       el `p-5` del atomo. Mismo lenguaje visual: gradiente + shadow-card. */
    <div
      className="group relative flex animate-fade-up flex-col overflow-hidden rounded-xl border border-border bg-gradient-to-b from-surface-2 to-surface shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover"
      style={{ animationDelay: `${(numero - 1) * 70}ms` }}
    >
      {/* Franja teñida por dificultad: el color se percibe antes de leer */}
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent to-transparent ${
          LUZ_DIFICULTAD[caso.Dificultad] ?? "via-border-strong"
        }`}
      />

      <div className="flex flex-1 flex-col gap-4 p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <span className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
            Expediente Nº {String(numero).padStart(2, "0")}
          </span>
          <Badge variant={caso.Dificultad}>
            {DIFICULTAD_LABELS[caso.Dificultad] ?? caso.Dificultad}
          </Badge>
        </div>

        <div className="flex-1">
          <h2 className="font-display text-xl font-semibold leading-snug text-text">
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
