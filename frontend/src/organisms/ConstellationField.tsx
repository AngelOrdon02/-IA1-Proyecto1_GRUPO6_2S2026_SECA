import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils.ts";

interface ConstellationFieldProps {
  /**
   * `ambient` es la capa de fondo de toda la app: casi invisible, solo
   * insinua movimiento. `hero` es la version densa y luminosa para un
   * bloque concreto, donde si debe mirarse.
   */
  variant?: "ambient" | "hero";
  className?: string;
}

interface Nodo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

const AJUSTES = {
  ambient: {
    /** Un nodo por cada N px² de lienzo: mantiene la densidad al redimensionar. */
    areaPorNodo: 26000,
    maxNodos: 90,
    distanciaEnlace: 148,
    velocidad: 0.11,
    alphaNodo: 0.5,
    alphaEnlace: 0.2,
    radioPuntero: 190,
  },
  hero: {
    areaPorNodo: 13000,
    maxNodos: 110,
    distanciaEnlace: 132,
    velocidad: 0.16,
    alphaNodo: 0.85,
    alphaEnlace: 0.42,
    radioPuntero: 200,
  },
} as const;

/** Esmeralda del tema (--color-accent) en componentes, para componer alpha. */
const RGB = "45, 212, 167";

/**
 * Malla de puntos que se enlazan entre si al acercarse.
 *
 * Es la metafora literal del producto: nodos sueltos que, cuando estan lo
 * bastante cerca, revelan una relacion — igual que las evidencias y las
 * personas del expediente. Por eso vive en el fondo de toda la app y no
 * solo en la portada.
 *
 * Detalles que evitan que se convierta en ruido o en un coste de CPU:
 *
 * - Un solo `requestAnimationFrame`, cancelado al desmontar y pausado
 *   mientras la pestaña esta oculta.
 * - La densidad se deriva del area, no es un numero fijo: en movil hay
 *   menos nodos y las lineas no se apelmazan.
 * - El puntero solo *ilumina* los enlaces cercanos; no empuja los nodos,
 *   que resultaba distractor sobre texto.
 * - Con `prefers-reduced-motion` se pinta un unico fotograma estatico: la
 *   textura permanece, el movimiento no.
 */
export default function ConstellationField({
  variant = "ambient",
  className,
}: ConstellationFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = AJUSTES[variant];
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let nodos: Nodo[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    const puntero = { x: -9999, y: -9999 };

    function sembrar() {
      const objetivo = Math.min(
        cfg.maxNodos,
        Math.max(18, Math.round((w * h) / cfg.areaPorNodo)),
      );
      nodos = Array.from({ length: objetivo }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * cfg.velocidad * 2,
        vy: (Math.random() - 0.5) * cfg.velocidad * 2,
        r: 0.8 + Math.random() * 1.1,
      }));
    }

    function medir() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      sembrar();
    }

    function pintar() {
      ctx!.clearRect(0, 0, w, h);

      // Enlaces primero: los nodos quedan por encima de sus propias lineas.
      for (let i = 0; i < nodos.length; i++) {
        const a = nodos[i];
        for (let j = i + 1; j < nodos.length; j++) {
          const b = nodos[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > cfg.distanciaEnlace * cfg.distanciaEnlace) continue;

          const d = Math.sqrt(d2);
          // La linea nace opaca al tocarse y se apaga al estirarse.
          let alpha = (1 - d / cfg.distanciaEnlace) * cfg.alphaEnlace;

          // Refuerzo alrededor del puntero: el trazo "responde" sin moverse.
          const mx = (a.x + b.x) / 2 - puntero.x;
          const my = (a.y + b.y) / 2 - puntero.y;
          const dm = Math.sqrt(mx * mx + my * my);
          if (dm < cfg.radioPuntero) {
            alpha += (1 - dm / cfg.radioPuntero) * cfg.alphaEnlace * 1.6;
          }

          ctx!.strokeStyle = `rgba(${RGB}, ${alpha.toFixed(3)})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      for (const n of nodos) {
        ctx!.fillStyle = `rgba(${RGB}, ${cfg.alphaNodo})`;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function avanzar() {
      for (const n of nodos) {
        n.x += n.vx;
        n.y += n.vy;
        // Rebote en los bordes: mantiene la densidad sin reciclar nodos.
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      pintar();
      raf = requestAnimationFrame(avanzar);
    }

    function onPuntero(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      puntero.x = e.clientX - rect.left;
      puntero.y = e.clientY - rect.top;
    }

    function onSalir() {
      puntero.x = -9999;
      puntero.y = -9999;
    }

    function onVisibilidad() {
      if (reduce) return;
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(avanzar);
    }

    medir();
    if (reduce) {
      pintar();
    } else {
      raf = requestAnimationFrame(avanzar);
    }

    const ro = new ResizeObserver(() => {
      medir();
      if (reduce) pintar();
    });
    ro.observe(canvas);
    window.addEventListener("pointermove", onPuntero, { passive: true });
    window.addEventListener("pointerleave", onSalir);
    document.addEventListener("visibilitychange", onVisibilidad);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPuntero);
      window.removeEventListener("pointerleave", onSalir);
      document.removeEventListener("visibilitychange", onVisibilidad);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none block h-full w-full", className)}
    />
  );
}
