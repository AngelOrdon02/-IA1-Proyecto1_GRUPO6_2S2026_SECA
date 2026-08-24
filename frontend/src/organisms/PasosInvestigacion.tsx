import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { MessageSquare, MapPin, Scale } from "lucide-react";
import { cn } from "@/lib/utils.ts";

interface Paso {
  icon: LucideIcon;
  titulo: string;
  texto: string;
}

const PASOS: Paso[] = [
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

/** Cuanto permanece iluminado cada paso antes de ceder al siguiente. */
const MS_POR_PASO = 3200;

/**
 * Los tres pasos de una investigacion, como recorrido y no como tres cards
 * sueltas: los nodos estan unidos por un riel que se va trazando en esmeralda
 * conforme avanza el paso activo, y el tramo que todavia no se ha recorrido
 * muestra un destello viajando hacia el siguiente nodo.
 *
 * El ciclo avanza solo cada `MS_POR_PASO`, se detiene mientras el puntero
 * esta encima y responde al clic en cualquier paso — de modo que se puede
 * mirar sin prisa el que interese.
 *
 * Al cerrar la vuelta, los rieles se remontan con una `key` nueva en lugar de
 * animarse de vuelta a cero: un trazo que se "desdibuja" hacia atras leeria
 * como un error, no como el inicio de otra vuelta.
 *
 * Con `prefers-reduced-motion` no hay ciclo: los tres pasos se muestran
 * recorridos y el riel completo, sin movimiento.
 */
export default function PasosInvestigacion() {
  const [reduce] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [activo, setActivo] = useState(0);
  const [ciclo, setCiclo] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (reduce || pausado) return;
    const id = window.setTimeout(() => {
      setActivo((i) => {
        const siguiente = (i + 1) % PASOS.length;
        if (siguiente === 0) setCiclo((c) => c + 1);
        return siguiente;
      });
    }, MS_POR_PASO);
    return () => window.clearTimeout(id);
  }, [activo, pausado, reduce]);

  const seleccionar = (i: number) => {
    setActivo(i);
    // Un paso elegido a mano no debe desaparecer al instante siguiente.
    setPausado(true);
  };

  return (
    <ol
      className="mb-12 flex flex-col gap-7 sm:flex-row sm:gap-0"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {PASOS.map((paso, i) => {
        const esActivo = reduce || i === activo;
        const recorrido = reduce || i < activo;
        const ultimo = i === PASOS.length - 1;

        return (
          <li key={paso.titulo} className="relative flex-1 sm:pr-6">
            {/* Riel vertical: en movil los pasos se apilan y sin el se leen
                como tres bloques sueltos en vez de un recorrido. */}
            {!ultimo && (
              <span className="absolute -bottom-7 left-[17px] top-10 w-px overflow-hidden bg-border sm:hidden">
                <span
                  key={`v-${ciclo}-${i}`}
                  className="absolute inset-x-0 top-0 bg-accent transition-[height] duration-700 ease-out"
                  style={{ height: recorrido ? "100%" : "0%" }}
                />
              </span>
            )}

            <div className="mb-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => seleccionar(i)}
                aria-current={esActivo ? "step" : undefined}
                aria-label={`Paso ${i + 1}: ${paso.titulo}`}
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm border bg-bg transition-colors duration-300",
                  esActivo
                    ? "border-accent bg-accent/12 text-accent"
                    : recorrido
                      ? "border-accent/30 text-accent/70"
                      : "border-border bg-surface-2 text-text-dim hover:border-border-strong hover:text-text-muted",
                )}
              >
                <paso.icon className="h-4 w-4" strokeWidth={1.75} />
              </button>

              <span
                className={cn(
                  "font-mono text-xs tabular-nums transition-colors duration-300",
                  esActivo ? "text-accent-soft" : "text-text-dim",
                )}
              >
                0{i + 1}
              </span>

              {/* Riel hacia el siguiente paso */}
              {!ultimo && (
                <span className="relative hidden h-px flex-1 overflow-hidden bg-border sm:block">
                  <span
                    key={`${ciclo}-${i}`}
                    className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-700 ease-out"
                    style={{ width: recorrido ? "100%" : "0%" }}
                  />
                  {/* Destello que anticipa el tramo aun sin recorrer */}
                  {esActivo && !recorrido && (
                    <span
                      aria-hidden="true"
                      className="animate-trace absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent"
                    />
                  )}
                </span>
              )}
            </div>

            <p
              className={cn(
                "font-medium transition-colors duration-300",
                esActivo ? "text-text" : "text-text-muted",
              )}
            >
              {paso.titulo}
            </p>
            <p
              className={cn(
                "mt-1 max-w-xs text-sm leading-relaxed transition-colors duration-300",
                esActivo ? "text-text-muted" : "text-text-dim",
              )}
            >
              {paso.texto}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
