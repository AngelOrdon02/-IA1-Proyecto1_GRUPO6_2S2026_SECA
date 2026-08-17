import { useState } from "react";
import type { ReactNode } from "react";
import {
  MessageSquare,
  MapPin,
  Fingerprint,
  Lightbulb,
  Scale,
  Check,
} from "lucide-react";
import { ActionChip } from "@/atoms";
import { ActionPopover } from "@/molecules";
import type { Sospechoso, Lugar, Evidencia } from "@/api/types.ts";

interface ActionComposerProps {
  sospechosos: Sospechoso[];
  lugares: Lugar[];
  evidencias: Evidencia[];
  pistasRestantes: number;
  sesionEstado: string;
  onInterrogar: (id: string, nombre: string) => void;
  onInvestigarLugar: (id: string, nombre: string) => void;
  onExaminarEvidencia: (id: string) => void;
  onSolicitarPista: () => void;
  onAcusar: () => void;
  disabled?: boolean;
}

type PopoverType = "interrogar" | "lugar" | "evidencia" | null;

export default function ActionComposer({
  sospechosos,
  lugares,
  evidencias,
  pistasRestantes,
  sesionEstado,
  onInterrogar,
  onInvestigarLugar,
  onExaminarEvidencia,
  onSolicitarPista,
  onAcusar,
  disabled = false,
}: ActionComposerProps) {
  const [openPopover, setOpenPopover] = useState<PopoverType>(null);

  const togglePopover = (type: PopoverType) => {
    setOpenPopover(openPopover === type ? null : type);
  };

  const cerrada = sesionEstado !== "en_curso";
  const pendientesInterrogar = sospechosos.filter((s) => !s.interrogado).length;
  const pendientesLugar = lugares.filter((l) => !l.investigado).length;

  return (
    <div className="relative shrink-0 bg-glass px-4 py-4 backdrop-blur-xl sm:px-6">
      {/* Hairline que se desvanece en los extremos */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-strong/60 to-transparent"
      />
      <div className="mx-auto w-full max-w-3xl">
        {cerrada ? (
          <p className="text-center text-sm text-text-muted">
            Esta investigación está cerrada. Consulta el informe final para
            revisar la deducción completa.
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-text-dim">
              Acciones disponibles
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <ActionPopover
                  open={openPopover === "interrogar"}
                  onClose={() => setOpenPopover(null)}
                  title="Interrogar a"
                  hint="Obtiene declaraciones y coartada"
                >
                  <OptionList>
                    {sospechosos.map((s) => (
                      <OptionRow
                        key={s.Id}
                        onClick={() => {
                          onInterrogar(s.Id, s.Nombre);
                          setOpenPopover(null);
                        }}
                        title={s.Nombre}
                        done={s.interrogado}
                        doneLabel="Interrogado"
                      />
                    ))}
                  </OptionList>
                </ActionPopover>
                <ActionChip
                  icon={MessageSquare}
                  label="Interrogar"
                  onClick={() => togglePopover("interrogar")}
                  disabled={disabled || sospechosos.length === 0}
                  active={openPopover === "interrogar"}
                  badge={pendientesInterrogar || undefined}
                  title={`${pendientesInterrogar} sospechosos sin interrogar`}
                />
              </div>

              <div className="relative">
                <ActionPopover
                  open={openPopover === "lugar"}
                  onClose={() => setOpenPopover(null)}
                  title="Investigar lugar"
                  hint="Revela evidencias y eventos del sitio"
                >
                  <OptionList>
                    {lugares.map((l) => (
                      <OptionRow
                        key={l.Id}
                        onClick={() => {
                          onInvestigarLugar(l.Id, l.Nombre);
                          setOpenPopover(null);
                        }}
                        title={l.Nombre}
                        done={l.investigado}
                        doneLabel="Investigado"
                      />
                    ))}
                  </OptionList>
                </ActionPopover>
                <ActionChip
                  icon={MapPin}
                  label="Lugar"
                  onClick={() => togglePopover("lugar")}
                  disabled={disabled || lugares.length === 0}
                  active={openPopover === "lugar"}
                  badge={pendientesLugar || undefined}
                  title={`${pendientesLugar} lugares sin investigar`}
                />
              </div>

              <div className="relative">
                <ActionPopover
                  open={openPopover === "evidencia"}
                  onClose={() => setOpenPopover(null)}
                  title="Examinar evidencia"
                  hint="Muestra con quién se vincula"
                >
                  <OptionList>
                    {evidencias.map((e) => (
                      <OptionRow
                        key={e.Id}
                        onClick={() => {
                          onExaminarEvidencia(e.Id);
                          setOpenPopover(null);
                        }}
                        title={e.Tipo}
                        subtitle={e.Descripcion}
                      />
                    ))}
                  </OptionList>
                </ActionPopover>
                <ActionChip
                  icon={Fingerprint}
                  label="Examinar"
                  onClick={() => togglePopover("evidencia")}
                  disabled={disabled || evidencias.length === 0}
                  active={openPopover === "evidencia"}
                  title={
                    evidencias.length === 0
                      ? "Investiga lugares para encontrar evidencias"
                      : `${evidencias.length} evidencias disponibles`
                  }
                />
              </div>

              <ActionChip
                icon={Lightbulb}
                label="Pista"
                onClick={onSolicitarPista}
                disabled={disabled || pistasRestantes <= 0}
                badge={Math.max(pistasRestantes, 0)}
                title={
                  pistasRestantes <= 0
                    ? "Sin pistas restantes"
                    : `${pistasRestantes} pistas restantes`
                }
              />

              <div className="ml-auto">
                <ActionChip
                  icon={Scale}
                  label="Acusar"
                  tone="danger"
                  onClick={onAcusar}
                  disabled={disabled || sospechosos.length === 0}
                  title="Cierra la investigación"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OptionList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-0.5">{children}</div>;
}

function OptionRow({
  onClick,
  title,
  subtitle,
  done,
  doneLabel,
}: {
  onClick: () => void;
  title: string;
  subtitle?: string;
  done?: boolean;
  doneLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-text">
          {title}
        </span>
        {subtitle && (
          <span className="block truncate text-xs text-text-dim">
            {subtitle}
          </span>
        )}
      </span>
      {done && (
        <span className="flex shrink-0 items-center gap-1 text-xs text-success-soft">
          <Check className="h-3.5 w-3.5" />
          {doneLabel}
        </span>
      )}
    </button>
  );
}
