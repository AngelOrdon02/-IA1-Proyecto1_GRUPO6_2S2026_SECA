import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Users,
  UserMinus,
  Fingerprint,
  AlertTriangle,
  ScrollText,
  ShieldCheck,
  BarChart3,
  ArrowLeft,
  Code2,
  MapPin,
  Clock,
  Printer,
  Network,
  History,
} from "lucide-react";
import AuraBackground from "@/organisms/AuraBackground.tsx";
import { SuspicionBar } from "@/organisms/ChatMessageContent.tsx";
import GrafoRelaciones from "@/organisms/GrafoRelaciones.tsx";
import {
  Card,
  Badge,
  Button,
  Spinner,
  MonoText,
  SectionHeading,
  EmptyState,
} from "@/atoms";
import { api } from "@/api/client.ts";
import type { InformeFinal } from "@/api/types.ts";
import { CATEGORIA_LABELS } from "@/lib/constants.ts";

export default function InformePage() {
  const { sesion: sesionId } = useParams<{ sesion: string }>();
  const [informe, setInforme] = useState<InformeFinal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sesionId) return;
    api
      .informe(sesionId)
      .then((r) => {
        setInforme(r.informe);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sesionId]);

  // Opcional 3: exportar el informe como PDF usando la impresión del navegador.
  const handlePrint = () => window.print();

  if (loading) {
    return (
      <AuraBackground>
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner size="lg" label="Generando informe" />
        </div>
      </AuraBackground>
    );
  }

  if (!informe) {
    return (
      <AuraBackground>
        <div className="flex min-h-dvh items-center justify-center px-4">
          <EmptyState
            icon={<ScrollText />}
            message="Informe no encontrado"
            hint="La sesión puede no estar cerrada todavía."
            action={
              <Link to="/">
                <Button variant="secondary">Volver al inicio</Button>
              </Link>
            }
          />
        </div>
      </AuraBackground>
    );
  }

  const isCorrect = informe.sesion.veredicto === "correcto";
  const maxPuntaje = Math.max(
    ...informe.ranking.map((s) => Number(s.Puntaje) || 0),
    1,
  );

  return (
    <AuraBackground>
      {/* Opcional 3: estilos de impresión — oculta chrome de la app,
          fuerza fondo blanco y texto negro para una salida PDF limpia. */}
      <style>{`
        @media print {
          body > *:not(#informe-root) { display: none !important; }
          #informe-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body, #informe-root { background: white !important; color: black !important; }
          .print\\:hidden, [data-aura], canvas { display: none !important; }
          * { box-shadow: none !important; text-shadow: none !important; }
          section, li, .informe-card { break-inside: avoid; }
          @page { margin: 2cm; }
        }
      `}</style>

      <div id="informe-root" className="min-h-dvh px-5 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto w-full max-w-4xl">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text print:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          {/* Cabecera del caso */}
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-dim">
              Informe final de investigación
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              {informe.ficha.Titulo}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
              <span>{informe.ficha.Hecho}</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-text-dim" />
                {informe.ficha.LugarNombre}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-text-dim" />
                {informe.ficha.HoraTexto}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-dim">
                Sesión: {informe.sesion.id} · Pistas: {informe.sesion.pistas}
              </span>
            </div>
          </header>

          {/* Veredicto */}
          <Card
            tone="raised"
            className={`mb-10 border-l-4 ${
              isCorrect ? "border-l-success" : "border-l-danger"
            }`}
          >
            <div className="flex items-start gap-4">
              {isCorrect ? (
                <CheckCircle2 className="h-8 w-8 shrink-0 text-success" />
              ) : (
                <XCircle className="h-8 w-8 shrink-0 text-danger" />
              )}
              <div className="min-w-0">
                <h2
                  className={`text-xl font-bold ${
                    isCorrect ? "text-success-soft" : "text-danger-soft"
                  }`}
                >
                  {isCorrect ? "Acusación correcta" : "Acusación incorrecta"}
                </h2>
                <p className="mt-1.5 leading-relaxed text-text-muted">
                  Acusaste a{" "}
                  <strong className="font-semibold text-text">
                    {informe.sesion.acusado}
                  </strong>
                  .
                  {informe.conclusion?.Estado === "resuelto" && (
                    <>
                      {" "}
                      El responsable lógico es{" "}
                      <strong className="font-semibold text-text">
                        {informe.conclusion.NombreResponsable}
                      </strong>{" "}
                      con {informe.conclusion.Puntaje} puntos de sospecha.
                    </>
                  )}
                </p>
                {/* Opcional 2: puntuacion final del detective */}
                {informe.sesion.puntuacion !== undefined && (
                  <p className="mt-2 text-sm font-medium text-accent-soft">
                    Puntuación final: {informe.sesion.puntuacion} pts
                  </p>
                )}
              </div>
            </div>
          </Card>

          <div className="space-y-10">
            {/* Ranking */}
            <section>
              <SectionHeading
                icon={BarChart3}
                title="Nivel de sospecha"
                count={informe.ranking.length}
              />
              <Card className="space-y-4">
                {informe.ranking.map((s, i) => (
                  <div key={s.Nombre} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-text-dim">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-text">
                        {s.Nombre}
                      </span>
                      <MonoText className="text-text-muted">
                        {s.Puntaje}
                      </MonoText>
                      <Badge
                        variant={
                          s.Categoria as "bajo" | "medio" | "alto" | "muy_alto"
                        }
                      >
                        {CATEGORIA_LABELS[s.Categoria] ?? s.Categoria}
                      </Badge>
                    </div>
                    <SuspicionBar
                      valor={Number(s.Puntaje) || 0}
                      max={maxPuntaje}
                      className="ml-8"
                    />
                  </div>
                ))}
              </Card>
            </section>

            {/* Red de Vínculos y Evidencias — oculta al imprimir */}
            <section className="print:hidden">
              <SectionHeading
                icon={Network}
                title="Red de Vínculos y Evidencias"
              />
              <GrafoRelaciones sesionId={sesionId!} />
            </section>

            {/* Cadena deductiva */}
            <section>
              <SectionHeading
                icon={ScrollText}
                title="Cadena deductiva"
                count={informe.reglas.length}
              />
              <ol className="space-y-3">
                {informe.reglas.map((r, i) => (
                  <li
                    key={r.Id}
                    className="informe-card flex gap-4 rounded-xl border border-border bg-surface p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/12 font-mono text-xs font-semibold text-accent-soft">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-text">
                          {r.Nombre}
                        </span>
                        <MonoText>{r.Id}</MonoText>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-text-muted">
                        {r.Descripcion}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="grid gap-10 lg:grid-cols-2">
              {/* Coartadas */}
              <section>
                <SectionHeading
                  icon={ShieldCheck}
                  title="Coartadas"
                  count={informe.coartadas.length}
                />
                <div className="space-y-2">
                  {informe.coartadas.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                    >
                      <span className="min-w-0 truncate font-medium text-text">
                        {c.Nombre}
                      </span>
                      <Badge
                        variant={c.Estado === "valida" ? "resuelto" : "fallido"}
                      >
                        {c.Estado === "valida" ? "Válida" : "Inválida"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>

              {/* Contradicciones */}
              <section>
                <SectionHeading
                  icon={AlertTriangle}
                  title="Contradicciones"
                  count={informe.contradicciones.length}
                />
                {informe.contradicciones.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-text-muted">
                    No se detectaron contradicciones.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {informe.contradicciones.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-warning/25 bg-warning/10 px-4 py-3"
                      >
                        <p className="text-xs font-medium text-warning-soft">
                          {c.A} ↔ {c.B}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-text">
                          {c.Texto}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {informe.complices.length > 0 && (
              <section>
                <SectionHeading
                  icon={Users}
                  title="Posibles cómplices"
                  count={informe.complices.length}
                />
                <div className="space-y-2">
                  {informe.complices.map((c) => (
                    <div
                      key={c.Persona}
                      className="rounded-lg border border-border bg-surface px-4 py-3"
                    >
                      <span className="font-medium text-text">{c.Nombre}</span>
                      <p className="mt-1 text-sm leading-relaxed text-text-muted">
                        {c.Texto}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <SectionHeading
                icon={UserMinus}
                title="Sospechosos descartados"
                count={informe.descartes.length}
              />
              <div className="space-y-2">
                {informe.descartes.map((d) => (
                  <div
                    key={d.Persona}
                    className="rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <span className="font-medium text-text">{d.Nombre}</span>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">
                      {d.Texto}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionHeading
                icon={Fingerprint}
                title="Bitácora"
                count={informe.bitacora.length}
              />
              <div className="overflow-hidden rounded-xl border border-border">
                {informe.bitacora.map((b, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2.5 last:border-b-0"
                  >
                    <Badge>{b.accion}</Badge>
                    <span className="min-w-0 flex-1 text-sm text-text-muted">
                      {b.detalle}
                    </span>
                    <MonoText>{b.momento}</MonoText>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer con acciones — oculto al imprimir */}
          <div className="mt-12 flex flex-wrap justify-center gap-3 border-t border-border pt-8 print:hidden">
            <Link to="/">
              <Button variant="primary">Volver al inicio</Button>
            </Link>
            {/* Opcional 3: exportar informe como PDF */}
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Link to="/historial">
              <Button variant="ghost">
                <History className="h-4 w-4" />
                Historial
              </Button>
            </Link>
            <a
              href={`/api/sesiones/${sesionId}/informe`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="ghost">
                <Code2 className="h-4 w-4" />
                Ver en JSON
              </Button>
            </a>
          </div>
        </div>
      </div>
    </AuraBackground>
  );
}