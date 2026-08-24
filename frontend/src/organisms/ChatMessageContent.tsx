import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Quote,
  Fingerprint,
  MapPin,
  Lightbulb,
  AlertTriangle,
  BarChart3,
  Scale,
  Info,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";
import { Badge } from "@/atoms";
import { CATEGORIA_LABELS, DIFICULTAD_LABELS } from "@/lib/constants.ts";
import type {
  WelcomeMessage,
  UserActionMessage,
  DeclarationMessage,
  EvidenceFoundMessage,
  EvidenceExaminedMessage,
  PlaceInvestigatedMessage,
  HintMessage,
  ContradictionMessage,
  SuspicionMessage,
  VerdictMessage,
  SystemMessage,
} from "@/hooks/chatTypes.ts";

/* ---------------------------------------------------------------------------
   Piezas compartidas
   --------------------------------------------------------------------------- */

type Tono = "accent" | "info" | "success" | "warning" | "danger";

const tonos: Record<Tono, string> = {
  accent: "text-accent",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

function Encabezado({
  icon: Icon,
  tono = "accent",
  children,
  extra,
}: {
  icon: LucideIcon;
  tono?: Tono;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 shrink-0 ${tonos[tono]}`} strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate font-medium text-text">
        {children}
      </span>
      {extra}
    </div>
  );
}

/** Rotulo de subseccion dentro de un mensaje. */
function Rotulo({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-dim">
      {children}
    </p>
  );
}

/** Tarjeta interna: superficie mas clara para separarla de la burbuja. */
function Interna({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg bg-surface-2 px-3 py-2.5 ${className}`}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Mensajes
   --------------------------------------------------------------------------- */

export function WelcomeMessageContent({
  message,
}: {
  message: WelcomeMessage;
}) {
  return (
    <div className="space-y-3">
      <Encabezado
        icon={FolderOpen}
        extra={
          <Badge variant={message.dificultad as "facil" | "medio" | "dificil"}>
            {DIFICULTAD_LABELS[message.dificultad] ?? message.dificultad}
          </Badge>
        }
      >
        {message.casoTitulo}
      </Encabezado>
      {/* El resumen del caso es contenido principal, no metadato: va en el
          color de texto pleno. */}
      <p className="text-sm leading-relaxed text-text-muted">
        {message.casoDescripcion}
      </p>
      <p className="border-t border-border pt-3 text-xs text-text-dim">
        Usa las acciones de abajo para interrogar, recorrer lugares y examinar
        evidencias. El expediente de la derecha se actualiza con cada hallazgo.
      </p>
    </div>
  );
}

export function UserActionContent({
  message,
}: {
  message: UserActionMessage;
}) {
  return (
    <p className="text-sm">
      <span className="font-semibold text-accent-soft">{message.action}</span>
      {message.target && <span className="text-text">: {message.target}</span>}
    </p>
  );
}

export function DeclarationContent({
  message,
}: {
  message: DeclarationMessage;
}) {
  return (
    <div className="space-y-3">
      <Encabezado icon={Quote}>{message.personaNombre}</Encabezado>

      {message.declaraciones.length > 0 && (
        <div className="space-y-2">
          <Rotulo>Declaración</Rotulo>
          {message.declaraciones.map((d) => (
            <blockquote
              key={d.Id}
              className="border-l-2 border-accent/60 pl-3 text-sm leading-relaxed text-text"
            >
              «{d.Texto}»
            </blockquote>
          ))}
        </div>
      )}

      {message.coartadas.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <Rotulo>Coartada</Rotulo>
          {message.coartadas.map((c, i) => (
            <Interna key={i}>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-text-dim">Lugar</dt>
                <dd className="text-text">{c.Lugar}</dd>
                <dt className="text-text-dim">Hora</dt>
                <dd className="text-text">{c.Hora}</dd>
                <dt className="text-text-dim">Testigo</dt>
                <dd className="text-text">{c.Testigo}</dd>
              </dl>
            </Interna>
          ))}
        </div>
      )}
    </div>
  );
}

export function EvidenceFoundContent({
  message,
}: {
  message: EvidenceFoundMessage;
}) {
  return (
    <div className="space-y-3">
      <Encabezado
        icon={Fingerprint}
        tono="success"
        extra={
          <span className="shrink-0 text-xs text-text-dim">
            {message.evidencias.length}{" "}
            {message.evidencias.length === 1 ? "hallazgo" : "hallazgos"}
          </span>
        }
      >
        Evidencias en {message.lugarNombre}
      </Encabezado>
      <div className="space-y-2">
        {message.evidencias.map((e) => (
          <Interna key={e.Id}>
            <p className="text-sm font-medium text-text">{e.Tipo}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-text-muted">
              {e.Descripcion}
            </p>
          </Interna>
        ))}
      </div>
    </div>
  );
}

export function EvidenceExaminedContent({
  message,
}: {
  message: EvidenceExaminedMessage;
}) {
  return (
    <div className="space-y-3">
      <Encabezado icon={Fingerprint}>{message.evidencia.Tipo}</Encabezado>
      <p className="text-sm leading-relaxed text-text-muted">
        {message.evidencia.Descripcion}
      </p>
      {message.vinculos.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <Rotulo>Vinculada a</Rotulo>
          <div className="flex flex-wrap gap-1.5">
            {message.vinculos.map((v) => (
              <Badge key={v.Persona} variant="info">
                {v.Nombre}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PlaceInvestigatedContent({
  message,
}: {
  message: PlaceInvestigatedMessage;
}) {
  return (
    <div className="space-y-3">
      <Encabezado icon={MapPin} tono="info">
        {message.lugarNombre}
      </Encabezado>
      <p className="text-sm leading-relaxed text-text-muted">
        {message.descripcion}
      </p>
      {message.eventos.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <Rotulo>Eventos</Rotulo>
          <ul className="space-y-1.5">
            {message.eventos.map((e, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 font-mono text-xs tabular-nums text-accent-soft">
                  {e.HoraTexto}
                </span>
                <span className="text-text">{e.Descripcion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function HintContent({ message }: { message: HintMessage }) {
  return (
    <div className="space-y-2">
      <Encabezado
        icon={Lightbulb}
        tono="warning"
        extra={
          <span className="shrink-0 text-xs text-text-dim">
            quedan {message.pista.restantes}
          </span>
        }
      >
        Pista {message.pista.numero}
      </Encabezado>
      {message.pista.texto ? (
        <p className="text-sm leading-relaxed text-text">
          {message.pista.texto}
        </p>
      ) : (
        <p className="text-sm text-text-muted">
          No quedan pistas disponibles para este caso.
        </p>
      )}
    </div>
  );
}

export function ContradictionContent({
  message,
}: {
  message: ContradictionMessage;
}) {
  return (
    <div className="space-y-3">
      <Encabezado icon={AlertTriangle} tono="warning">
        Contradicción detectada
      </Encabezado>
      {message.contradicciones.map((c, i) => (
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

export function SuspicionContent({
  message,
}: {
  message: SuspicionMessage;
}) {
  const max = Math.max(
    ...message.sospecha.map((s) => Number(s.Puntaje) || 0),
    1,
  );

  return (
    <div className="space-y-3">
      <Encabezado icon={BarChart3}>Nivel de sospecha</Encabezado>
      <div className="space-y-2.5">
        {message.sospecha.map((s) => (
          <div key={s.Nombre} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm text-text">
                {s.Nombre}
              </span>
              <span className="font-mono text-xs tabular-nums text-text-muted">
                {s.Puntaje}
              </span>
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
    </div>
  );
}

/** Barra proporcional al puntaje mas alto de la lista. El color cambia con
    la proporcion: verde cuando la sospecha es baja, rojo cuando arde. El
    relleno es plano — el gradiente y el resplandor que tenia antes hacian
    parecer un medidor de videojuego lo que es un dato del expediente. */
export function SuspicionBar({
  valor,
  max,
  className = "",
}: {
  valor: number;
  max: number;
  className?: string;
}) {
  const pct = Math.max(4, Math.min(100, (valor / max) * 100));
  const tono = pct < 35 ? "bg-success" : pct < 70 ? "bg-warning" : "bg-danger";
  return (
    <div
      className={`h-1 overflow-hidden rounded-xs bg-surface-3 ${className}`}
    >
      <div
        className={`h-full rounded-xs transition-[width] duration-500 ${tono}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function VerdictContent({ message }: { message: VerdictMessage }) {
  const isCorrect = message.resultado.veredicto === "correcto";
  return (
    <div className="space-y-3">
      <Encabezado icon={Scale} tono={isCorrect ? "success" : "danger"}>
        <span className={isCorrect ? "text-success-soft" : "text-danger-soft"}>
          {isCorrect ? "Acusación correcta" : "Acusación incorrecta"}
        </span>
      </Encabezado>
      <Interna>
        <p className="text-sm text-text">
          Acusaste a{" "}
          <strong className="font-semibold">
            {message.resultado.nombre_acusado}
          </strong>
        </p>
        <p className="mt-1 text-sm text-text-muted">
          El responsable lógico es{" "}
          <strong className="font-semibold text-text">
            {message.resultado.nombre_responsable}
          </strong>{" "}
          ({message.resultado.puntaje} puntos)
        </p>
      </Interna>
      <p className="flex items-center gap-1.5 text-xs text-text-dim">
        <ShieldCheck className="h-3.5 w-3.5" />
        La sesión quedó cerrada. Revisa el informe final para ver la cadena
        deductiva.
      </p>
    </div>
  );
}

export function SystemContent({ message }: { message: SystemMessage }) {
  return (
    <div className="flex items-start gap-2.5">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
      <p className="text-sm leading-relaxed text-text-muted">{message.text}</p>
    </div>
  );
}
