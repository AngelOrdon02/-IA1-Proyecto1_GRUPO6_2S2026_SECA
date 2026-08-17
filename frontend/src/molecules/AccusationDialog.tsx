import { useEffect, useState } from "react";
import { X, Scale, AlertTriangle, Check } from "lucide-react";
import { Button, Avatar } from "@/atoms";
import type { Sospechoso } from "@/api/types.ts";

interface AccusationDialogProps {
  open: boolean;
  onClose: () => void;
  sospechosos: Sospechoso[];
  onConfirm: (acusadoId: string) => void;
  disabled?: boolean;
}

export default function AccusationDialog({
  open,
  onClose,
  sospechosos,
  onConfirm,
  disabled = false,
}: AccusationDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      return;
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleConfirm = () => {
    if (selected) onConfirm(selected);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="acusacion-titulo"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-lg animate-scale-in flex-col rounded-t-2xl border border-border-strong bg-surface-2 shadow-2xl shadow-black/70 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-danger/25 bg-danger/12 text-danger">
              <Scale className="h-5 w-5" />
            </span>
            <div>
              <h3
                id="acusacion-titulo"
                className="text-lg font-semibold text-text"
              >
                Acusación final
              </h3>
              <p className="text-sm text-text-muted">
                Cierra la investigación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 rounded-lg p-2 text-text-dim transition-colors hover:bg-surface-hover hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-warning/25 bg-warning/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-sm text-warning-soft">
              La acusación no se puede deshacer. Al confirmar se genera el
              informe final y la sesión queda cerrada.
            </p>
          </div>

          <p className="mb-3 text-sm font-medium text-text-muted">
            Selecciona al responsable
          </p>

          <div className="space-y-2">
            {sospechosos.map((s) => {
              const activo = selected === s.Id;
              return (
                <button
                  key={s.Id}
                  type="button"
                  onClick={() => setSelected(s.Id)}
                  aria-pressed={activo}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150 ${
                    activo
                      ? "border-danger bg-danger/12"
                      : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover"
                  }`}
                >
                  <Avatar name={s.Nombre} size="sm" />
                  <span className="flex-1 font-medium text-text">
                    {s.Nombre}
                  </span>
                  {s.interrogado && !activo && (
                    <span className="text-xs text-text-dim">Interrogado</span>
                  )}
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      activo
                        ? "border-danger bg-danger text-accent-ink"
                        : "border-border-strong"
                    }`}
                  >
                    {activo && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={onClose} block>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!selected || disabled}
            block
          >
            Confirmar acusación
          </Button>
        </div>
      </div>
    </div>
  );
}
