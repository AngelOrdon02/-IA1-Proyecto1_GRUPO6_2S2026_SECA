import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, FileText, MapPin, Clock, Star } from "lucide-react";
import AuraBackground from "@/organisms/AuraBackground.tsx";
import { ChatLayout } from "@/templates";
import { ChatThread, ActionComposer, ExpedientePanel } from "@/organisms";
import { AccusationDialog } from "@/molecules";
import { Spinner, Badge, Button } from "@/atoms";
import { useChat, useSesiones, generateId } from "@/hooks";
import { api } from "@/api/client.ts";
import type { Sospechoso, Lugar, Evidencia, FichaCaso } from "@/api/types.ts";
import type { ChatMessage } from "@/hooks/chatTypes.ts";
import { DIFICULTAD_LABELS, ESTADO_LABELS } from "@/lib/constants.ts";

const TOTAL_PISTAS = 5;

// Opcional 2: penalizacion por cada accion de investigacion.
const DELTA_ACCION = -5;

export default function InvestigacionPage() {
  const { sesion: sesionId } = useParams<{ sesion: string }>();
  const { sesiones, titulos, loading: loadingSesiones } = useSesiones();
  const [ficha, setFicha] = useState<FichaCaso | null>(null);
  const [sospechosos, setSospechosos] = useState<Sospechoso[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [pistasUsadas, setPistasUsadas] = useState(0);
  const [sesionEstado, setSesionEstado] = useState<string>("en_curso");
  const [loadingData, setLoadingData] = useState(true);
  // Opcional 2: puntuacion visible en la TopBar.
  const [puntuacion, setPuntuacion] = useState<number>(100);

  const {
    messages,
    isLoading,
    thinking,
    error,
    setError,
    loadMessages,
    interrogar,
    investigarLugar,
    examinarEvidencia,
    solicitarPista,
    acusar,
  } = useChat(sesionId ?? "");
  const [showAccusation, setShowAccusation] = useState(false);

  useEffect(() => {
    if (!sesionId) return;

    async function loadData() {
      try {
        setLoadingData(true);

        const sesionRes = await api.sesion(sesionId!);
        const casoId = sesionRes.sesion.caso;

        // Opcional 2: carga la puntuacion guardada en la sesion.
        setPuntuacion(sesionRes.sesion.puntuacion ?? 100);

        const [fichaRes, sospechososRes, lugaresRes, evidenciasRes] =
          await Promise.all([
            api.casoDetalle(casoId).catch(() => null),
            api.sospechosos(sesionId!),
            api.lugares(sesionId!),
            api.evidencias(sesionId!),
          ]);

        setSesionEstado(sesionRes.sesion.estado);
        setPistasUsadas(sesionRes.sesion.pistas);
        setSospechosos(sospechososRes.sospechosos);
        setLugares(lugaresRes.lugares);
        setEvidencias(evidenciasRes.evidencias);

        if (fichaRes) {
          setFicha(fichaRes.ficha);
          const welcomeMsg: ChatMessage = {
            id: generateId(),
            type: "welcome",
            timestamp: new Date(),
            casoTitulo: fichaRes.ficha.Titulo,
            casoDescripcion: fichaRes.ficha.Descripcion,
            dificultad: fichaRes.ficha.Dificultad,
          };
          loadMessages([welcomeMsg]);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [sesionId]);

  // Opcional 2: aplica una penalizacion tras cada accion del detective.
  const aplicarPenalizacion = async () => {
    if (!sesionId) return;
    try {
      const res = await api.registrarPuntos(sesionId, DELTA_ACCION);
      setPuntuacion(res.puntuacion);
    } catch {
      // Si falla el registro de puntos no interrumpimos la investigacion.
    }
  };

  const veredicto = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((m): m is Extract<ChatMessage, { type: "verdict" }> =>
          m.type === "verdict",
        ),
    [messages],
  );

  const ultimaPista = useMemo(
    () =>
      [...messages]
        .reverse()
        .find((m): m is Extract<ChatMessage, { type: "hint" }> =>
          m.type === "hint",
        ),
    [messages],
  );

  const estadoActual = veredicto
    ? veredicto.resultado.veredicto === "correcto"
      ? "resuelto"
      : "fallido"
    : sesionEstado;

  const pistasRestantes = ultimaPista
    ? ultimaPista.pista.restantes
    : Math.max(TOTAL_PISTAS - pistasUsadas, 0);

  const cerrada = estadoActual !== "en_curso";

  if (!sesionId) {
    return (
      <AuraBackground>
        <div className="flex min-h-dvh items-center justify-center px-4 text-center">
          <div>
            <p className="text-text-muted">Sesión no encontrada.</p>
            <Link to="/" className="mt-4 inline-block">
              <Button variant="secondary">Volver al inicio</Button>
            </Link>
          </div>
        </div>
      </AuraBackground>
    );
  }

  if (loadingData || loadingSesiones) {
    return (
      <AuraBackground>
        <ChatLayout
          sesiones={sesiones}
          titulos={titulos}
          sidebarLoading={loadingSesiones}
        >
          <div className="flex flex-1 items-center justify-center">
            <Spinner size="lg" label="Abriendo el expediente" />
          </div>
        </ChatLayout>
      </AuraBackground>
    );
  }

  return (
    <AuraBackground>
      <ChatLayout
        sesiones={sesiones}
        titulos={titulos}
        sidebarLoading={loadingSesiones}
        title={ficha?.Titulo ?? "Investigación"}
        subtitle={
          ficha ? (
            <span className="inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {ficha.LugarNombre}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {ficha.HoraTexto}
              </span>
            </span>
          ) : undefined
        }
        badges={
          <>
            {ficha && (
              <Badge
                variant={ficha.Dificultad as "facil" | "medio" | "dificil"}
              >
                {DIFICULTAD_LABELS[ficha.Dificultad] ?? ficha.Dificultad}
              </Badge>
            )}
            <Badge
              variant={estadoActual as "en_curso" | "resuelto" | "fallido"}
            >
              {ESTADO_LABELS[estadoActual] ?? estadoActual}
            </Badge>
            {/* Opcional 2: badge de puntuacion en tiempo real */}
            <span className="inline-flex items-center gap-1 rounded-sm border border-accent/25 bg-accent/10 px-2 py-0.5 text-xs font-medium tabular-nums text-accent-soft">
              <Star className="h-3 w-3" />
              {puntuacion} pts
            </span>
          </>
        }
        actions={
          cerrada ? (
            <Link to={`/investigacion/${sesionId}/informe`}>
              <Button variant="primary" size="sm">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Ver informe</span>
              </Button>
            </Link>
          ) : undefined
        }
        rightPanel={
          <ExpedientePanel
            sesionId={sesionId}
            refreshKey={messages.length}
          />
        }
      >
        {error && (
          <div className="flex shrink-0 items-start gap-3 border-b border-danger/25 bg-danger/10 px-5 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="flex-1 text-sm text-danger-soft">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-sm font-medium text-danger-soft underline underline-offset-2"
            >
              Cerrar
            </button>
          </div>
        )}

        <ChatThread
          messages={messages}
          isLoading={isLoading}
          thinking={thinking}
        />

        <ActionComposer
          sospechosos={sospechosos}
          lugares={lugares}
          evidencias={evidencias}
          pistasRestantes={pistasRestantes}
          sesionEstado={estadoActual}
          onInterrogar={(id, nombre) => {
            interrogar(id, nombre);
            aplicarPenalizacion();
            setSospechosos((prev) =>
              prev.map((s) => (s.Id === id ? { ...s, interrogado: true } : s)),
            );
          }}
          onInvestigarLugar={async (id, nombre) => {
            await investigarLugar(id, nombre);
            aplicarPenalizacion();
            setLugares((prev) =>
              prev.map((l) => (l.Id === id ? { ...l, investigado: true } : l)),
            );
            api
              .evidencias(sesionId)
              .then((r) => setEvidencias(r.evidencias))
              .catch(() => {});
          }}
          onExaminarEvidencia={(id) => {
            const ev = evidencias.find((e) => e.Id === id);
            examinarEvidencia(id, ev?.Tipo);
            aplicarPenalizacion();
          }}
          onSolicitarPista={() => {
            solicitarPista();
            aplicarPenalizacion();
          }}
          onAcusar={() => setShowAccusation(true)}
          disabled={isLoading || cerrada}
        />

        <AccusationDialog
          open={showAccusation}
          onClose={() => setShowAccusation(false)}
          sospechosos={sospechosos}
          onConfirm={(id) => {
            const s = sospechosos.find((x) => x.Id === id);
            acusar(id, s?.Nombre);
            setShowAccusation(false);
          }}
          disabled={isLoading}
        />
      </ChatLayout>
    </AuraBackground>
  );
}