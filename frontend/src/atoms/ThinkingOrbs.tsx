import { useEffect, useState } from "react";
import { ThinkingOrb, type OrbState } from "thinking-orbs";
import { cn } from "@/lib/utils.ts";

interface ThinkingOrbsProps {
  /** Animacion del orbe; describe *que* esta haciendo el sistema. */
  state?: OrbState;
  /**
   * Texto del estado; se anima con un barrido de luz. Con varias frases se
   * van encadenando mientras dura la espera, de modo que una consulta larga
   * no se queda con el mismo cartel congelado.
   */
  label?: string | string[];
  /** 20 = escala de linea de texto, 64 = escala de avatar. */
  size?: 20 | 64;
  className?: string;
}

/** Cada cuanto avanza a la siguiente frase cuando hay mas de una. */
const MS_POR_FRASE = 1800;

/**
 * Indicador de "el sistema esta razonando".
 *
 * El orbe viene de `thinking-orbs` (orbs.jakubantalik.com): un canvas 2D de
 * puntos con nueve animaciones distintas, una por verbo — buscar, resolver,
 * escuchar, conectar… Aqui se elige la que corresponde a la accion en curso,
 * asi que la espera no es un cargador generico: la forma del orbe ya dice si
 * el sistema esta recorriendo un lugar o cruzando declaraciones.
 *
 * El tema se fija a `dark` en lugar de dejarlo en `auto`: la aplicacion es de
 * tema oscuro fijo, y `auto` caeria en `prefers-color-scheme` — con el
 * sistema en claro pintaria tinta oscura sobre fondo oscuro.
 *
 * `prefers-reduced-motion` lo deja en un fotograma estatico (lo resuelve la
 * propia libreria) y el barrido del texto lo congela la regla global del tema.
 */
export default function ThinkingOrbs({
  state = "working",
  label,
  size = 20,
  className,
}: ThinkingOrbsProps) {
  const frases = label === undefined ? [] : Array.isArray(label) ? label : [label];
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    setIndice(0);
    if (frases.length < 2) return;
    const id = window.setInterval(() => {
      // Se detiene en la ultima: la siguiente informacion util es la respuesta.
      setIndice((i) => Math.min(i + 1, frases.length - 1));
    }, MS_POR_FRASE);
    return () => window.clearInterval(id);
    // Las frases son constantes por accion; su union identifica la secuencia.
  }, [frases.join("|")]);

  return (
    <div
      className={cn("flex items-center gap-2.5", className)}
      role="status"
      aria-live="polite"
    >
      <ThinkingOrb
        state={state}
        size={size}
        theme="dark"
        aria-hidden="true"
        className="shrink-0"
      />

      {frases.length > 0 && (
        <span
          key={indice}
          className="animate-shimmer bg-clip-text text-sm text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(100deg, var(--color-text-dim) 20%, var(--color-accent-soft) 45%, var(--color-text-dim) 70%)",
            backgroundSize: "200% 100%",
          }}
        >
          {frases[indice]}
        </span>
      )}
      <span className="sr-only">Procesando</span>
    </div>
  );
}
