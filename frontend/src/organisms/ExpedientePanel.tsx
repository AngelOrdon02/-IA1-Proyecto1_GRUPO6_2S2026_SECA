import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Fingerprint,
  Link2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  BarChart3,
  FolderOpen,
  ScrollText,
  RefreshCw,
  Network,
} from "lucide-react";
import { Badge, EmptyState, MonoText } from "@/atoms";
import { TabItem } from "@/molecules";
import { SuspicionBar } from "./ChatMessageContent.tsx";
import GrafoRelaciones from "./GrafoRelaciones.tsx";
import { api } from "@/api/client.ts";
import type {
  Sospechoso,
  Evidencia,
  Relacion,
  Coartada,
  EventoTemporal,
  Contradiccion,
  NivelSospecha,
  BitacoraEntry,
} from "@/api/types.ts";
import { CATEGORIA_LABELS } from "@/lib/constants.ts";

interface ExpedientePanelProps {
  sesionId: string;
  /** Cambia para forzar una recarga (p. ej. la cantidad de mensajes). */
  refreshKey?: number;
}

type TabKey =
  | "sospechosos"
  | "evidencias"
  | "grafo"
  | "sospecha"
  | "coartadas"
  | "timeline"
  | "relaciones"
  | "contradicciones"
  | "bitacora";

const TABS: Array<{ key: TabKey; label: string; icon: typeof Users }> = [
  { key: "sospechosos", label: "Sospechosos", icon: Users },
  { key: "evidencias", label: "Evidencias", icon: Fingerprint },
  { key: "grafo", label: "Grafo", icon: Network },
  { key: "sospecha", label: "Sospecha", icon: BarChart3 },
  { key: "coartadas", label: "Coartadas", icon: ShieldCheck },
  { key: "timeline", label: "Tiempo", icon: Clock },
  { key: "relaciones", label: "Relaciones", icon: Link2 },
  { key: "contradicciones", label: "Contradicciones", icon: AlertTriangle },
  { key: "bitacora", label: "Bitácora", icon: ScrollText },
];

export default function ExpedientePanel({
  sesionId,
  refreshKey = 0,
}: ExpedientePanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("sospechosos");
  const [cargando, setCargando] = useState(false);
  const [sospechosos, setSospechosos] = useState<Sospechoso[]>([]);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
  const [coartadas, setCoartadas] = useState<Coartada[]>([]);
  const [timeline, setTimeline] = useState<EventoTemporal[]>([]);
  const [contradicciones, setContradicciones] = useState<Contradiccion[]>([]);
  const [sospecha, setSospecha] = useState<NivelSospecha[]>([]);
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>([]);

  const cargar = useCallback(async () => {
    setCargando(true);
    await Promise.all([
      api.sospechosos(sesionId).then((r) => setSospechosos(r.sospechosos)).catch(() => {}),
      api.evidencias(sesionId).then((r) => setEvidencias(r.evidencias)).catch(() => {}),
      api.relaciones(sesionId).then((r) => setRelaciones(r.relaciones)).catch(() => {}),
      api.coartadas(sesionId).then((r) => setCoartadas(r.coartadas)).catch(() => {}),
      api.lineaTemporal(sesionId).then((r) => setTimeline(r.eventos)).catch(() => {}),
      api.contradicciones(sesionId).then((r) => setContradicciones(r.contradicciones)).catch(() => {}),
      api.sospecha(sesionId).then((r) => setSospecha(r.sospecha)).catch(() => {}),
      api.bitacora(sesionId).then((r) => setBitacora(r.bitacora)).catch(() => {}),
    ]);
    setCargando(false);
  }, [sesionId]);

  /* Antes solo se cargaba al montar, asi que el panel quedaba desfasado del
     chat en cuanto se hacia la primera accion. */
  useEffect(() => {
    cargar();
  }, [cargar, refreshKey]);

  const counts: Record<TabKey, number> = {
    sospechosos: sospechosos.length,
    evidencias: evidencias.length,
    grafo: sospechosos.length + evidencias.length,
    sospecha: sospecha.length,
    coartadas: coartadas.length,
    timeline: timeline.length,
    relaciones: relaciones.length,
    contradicciones: contradicciones.length,
    bitacora: bitacora.length,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3.5">
        <FolderOpen className="h-4 w-4 shrink-0 text-accent" />
        <h2 className="flex-1 text-sm font-semibold text-text">Expediente</h2>
        <button
          type="button"
          onClick={cargar}
          aria-label="Actualizar expediente"
          className="mr-10 rounded-lg p-1.5 text-text-dim transition-colors hover:bg-surface-hover hover:text-text lg:mr-0"
        >
          <RefreshCw
            className={`h-4 w-4 ${cargando ? "animate-spin text-accent" : ""}`}
          />
        </button>
      </div>

      {/* Rail horizontal: el vertical de 176px dejaba ~144px utiles de panel */}
      <div
        role="tablist"
        className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-2 py-2"
      >
        {TABS.map((tab) => (
          <TabItem
            key={tab.key}
            icon={tab.icon}
            label={tab.label}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            badge={counts[tab.key]}
          />
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === "sospechosos" && (
          <SospechososTab sospechosos={sospechosos} />
        )}
        {activeTab === "evidencias" && <EvidenciasTab evidencias={evidencias} />}
        {activeTab === "grafo" && (
          <GrafoRelaciones
            sesionId={sesionId}
            refreshKey={refreshKey}
            compact
          />
        )}
        {activeTab === "sospecha" && <SospechaTab sospecha={sospecha} />}
        {activeTab === "coartadas" && <CoartadasTab coartadas={coartadas} />}
        {activeTab === "timeline" && <TimelineTab eventos={timeline} />}
        {activeTab === "relaciones" && <RelacionesTab relaciones={relaciones} />}
        {activeTab === "contradicciones" && (
          <ContradiccionesTab contradicciones={contradicciones} />
        )}
        {activeTab === "bitacora" && <BitacoraTab bitacora={bitacora} />}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Pestañas
   -------------------------------------------------------------------------- */

function Fila({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface px-3 py-2.5 ${className}`}
    >
      {children}
    </div>
  );
}

function SospechososTab({ sospechosos }: { sospechosos: Sospechoso[] }) {
  if (sospechosos.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        message="Sin sospechosos"
        hint="Aparecerán al cargar el caso."
      />
    );
  }
  return (
    <div className="space-y-2">
      {sospechosos.map((s) => (
        <Fila key={s.Id} className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-medium text-text">
            {s.Nombre}
          </span>
          <Badge variant={s.interrogado ? "resuelto" : "default"}>
            {s.interrogado ? "Interrogado" : "Pendiente"}
          </Badge>
        </Fila>
      ))}
    </div>
  );
}

function EvidenciasTab({ evidencias }: { evidencias: Evidencia[] }) {
  if (evidencias.length === 0) {
    return (
      <EmptyState
        icon={<Fingerprint />}
        message="Sin evidencias"
        hint="Investiga lugares para encontrarlas."
      />
    );
  }
  return (
    <div className="space-y-2">
      {evidencias.map((e) => (
        <Fila key={e.Id}>
          <p className="text-sm font-medium text-text">{e.Tipo}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-text-muted">
            {e.Descripcion}
          </p>
          <MonoText className="mt-1.5 block">
            {e.Lugar} · {e.Hora}
          </MonoText>
        </Fila>
      ))}
    </div>
  );
}

function RelacionesTab({ relaciones }: { relaciones: Relacion[] }) {
  if (relaciones.length === 0) {
    return <EmptyState icon={<Link2 />} message="Sin relaciones" />;
  }
  return (
    <div className="space-y-2">
      {relaciones.map((r, i) => (
        <Fila key={i} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-text">{r.Nombre1}</span>
          <Badge variant="info">{r.Tipo}</Badge>
          <span className="text-text">{r.Nombre2}</span>
        </Fila>
      ))}
    </div>
  );
}

function CoartadasTab({ coartadas }: { coartadas: Coartada[] }) {
  if (coartadas.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck />}
        message="Sin coartadas"
        hint="Interroga sospechosos para registrarlas."
      />
    );
  }
  return (
    <div className="space-y-2">
      {coartadas.map((c, i) => (
        <Fila key={i}>
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-sm font-medium text-text">
              {c.Nombre}
            </span>
            <Badge variant={c.Estado === "valida" ? "resuelto" : "fallido"}>
              {c.Estado === "valida" ? "Válida" : "Inválida"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            {c.Lugar} · {c.Hora}
          </p>
          <p className="text-xs text-text-dim">Testigo: {c.Testigo}</p>
        </Fila>
      ))}
    </div>
  );
}

function TimelineTab({ eventos }: { eventos: EventoTemporal[] }) {
  if (eventos.length === 0) {
    return <EmptyState icon={<Clock />} message="Sin eventos" />;
  }
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {eventos.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-bg-soft bg-accent" />
          <MonoText className="text-accent-soft">{e.HoraTexto}</MonoText>
          <p className="text-sm leading-relaxed text-text">{e.Descripcion}</p>
          <p className="text-xs text-text-dim">{e.LugarNombre}</p>
        </li>
      ))}
    </ol>
  );
}

function ContradiccionesTab({
  contradicciones,
}: {
  contradicciones: Contradiccion[];
}) {
  if (contradicciones.length === 0) {
    return (
      <EmptyState
        icon={<AlertTriangle />}
        message="Sin contradicciones"
        hint="Aparecen al cruzar declaraciones con evidencias."
      />
    );
  }
  return (
    <div className="space-y-2">
      {contradicciones.map((c, i) => (
        <div
          key={i}
          className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-2.5"
        >
          <p className="text-xs font-medium text-warning-soft">
            {c.A} ↔ {c.B}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-text">{c.Texto}</p>
        </div>
      ))}
    </div>
  );
}

function SospechaTab({ sospecha }: { sospecha: NivelSospecha[] }) {
  if (sospecha.length === 0) {
    return <EmptyState icon={<BarChart3 />} message="Sin datos" />;
  }
  const max = Math.max(...sospecha.map((s) => Number(s.Puntaje) || 0), 1);
  return (
    <div className="space-y-3">
      {sospecha.map((s) => (
        <div key={s.Nombre} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
              {s.Nombre}
            </span>
            <MonoText className="text-text-muted">{s.Puntaje}</MonoText>
            <Badge
              variant={s.Categoria as "bajo" | "medio" | "alto" | "muy_alto"}
            >
              {CATEGORIA_LABELS[s.Categoria] ?? s.Categoria}
            </Badge>
          </div>
          <SuspicionBar valor={Number(s.Puntaje) || 0} max={max} />
        </div>
      ))}
    </div>
  );
}

function BitacoraTab({ bitacora }: { bitacora: BitacoraEntry[] }) {
  if (bitacora.length === 0) {
    return <EmptyState icon={<ScrollText />} message="Sin registros" />;
  }
  return (
    <div className="space-y-2">
      {bitacora.map((b, i) => (
        <Fila key={i}>
          <div className="flex items-center justify-between gap-2">
            <Badge>{b.accion}</Badge>
            <MonoText>{b.momento}</MonoText>
          </div>
          <p className="mt-1.5 text-sm text-text-muted">{b.detalle}</p>
        </Fila>
      ))}
    </div>
  );
}
