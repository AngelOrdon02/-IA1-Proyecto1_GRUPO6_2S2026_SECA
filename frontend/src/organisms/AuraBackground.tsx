import type { ReactNode } from "react";

/**
 * Ambiente de fondo "Noir Aurora".
 *
 * Arquitectura de luz, de arriba hacia abajo en orden de pintado:
 *
 *   1-2. Cortinas de aurora (esmeralda/teal) con `screen`, concentradas en
 *      el tercio superior por mascaras radiales: es la zona del sidebar y la
 *      marca, donde casi no hay texto corrido.
 *   3. Resplandor azul profundo en la esquina superior derecha: contrapunto
 *      frio que da profundidad sin salirse de la familia.
 *   4-5. Resplandores esmeralda abajo a la derecha (y un eco tenue a la
 *      izquierda): anclan el fondo con el acento de la marca.
 *   6. "Corredor central" con `multiply`: oscurece la franja donde vive el
 *      contenido (chat, cards, formularios). Es la pieza que garantiza el
 *      contraste del texto sin tener que apagar las auroras.
 *   7. Reticula, vineta y grano de pelicula.
 *
 * La primera version con blend modes fallo por usar paradas en blanco puro:
 * aqui ninguna parada pasa de un cian/teal suave con alpha <= 0.26.
 *
 * La capa es `fixed`: no se repinta al hacer scroll ni crece con el
 * contenido. Las cortinas derivan muy despacio; la regla global de
 * `prefers-reduced-motion` las deja estaticas.
 */
export default function AuraBackground({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-bg"
      >
        {/* Cortina esmeralda, diagonal desde arriba-izquierda */}
        <div
          className="animate-aurora-a absolute -inset-[8%] blur-[85px] md:blur-[122px]"
          style={{
            background:
              "linear-gradient(154deg, transparent 18%, rgba(10,61,47,0.06) 29%, rgba(43,217,199,0.18) 36%, rgba(125,235,200,0.26) 42%, rgba(53,212,156,0.24) 48%, rgba(30,150,110,0.18) 55%, rgba(38,196,166,0.20) 62%, rgba(13,72,56,0.08) 68%, transparent 82%)",
            mixBlendMode: "screen",
            maskImage:
              "radial-gradient(ellipse 92% 62% at 32% 0%, black 25%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 92% 62% at 32% 0%, black 25%, transparent 72%)",
          }}
        />

        {/* Segunda cortina, teal cruzando desde arriba-derecha */}
        <div
          className="animate-aurora-b absolute -inset-[8%] opacity-90 blur-[75px] md:blur-[108px]"
          style={{
            background:
              "linear-gradient(128deg, transparent 28%, rgba(14,84,70,0.06) 38%, rgba(38,196,166,0.16) 43%, rgba(115,226,205,0.22) 48%, rgba(62,196,170,0.18) 52%, rgba(43,217,199,0.14) 57%, rgba(22,102,88,0.10) 62%, transparent 76%)",
            mixBlendMode: "screen",
            maskImage:
              "radial-gradient(ellipse 85% 60% at 68% 4%, black 22%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 85% 60% at 68% 4%, black 22%, transparent 72%)",
          }}
        />

        {/* Azul profundo tenue, esquina superior derecha */}
        <div
          className="animate-aurora-c absolute -inset-[8%] opacity-70 blur-[110px] md:blur-[160px]"
          style={{
            background:
              "radial-gradient(ellipse 50% 28% at 76% 12%, rgba(44,92,138,0.11) 0%, rgba(35,68,100,0.045) 45%, transparent 82%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Esmeralda, abajo a la derecha: ancla con el acento de marca */}
        <div
          className="animate-aurora-b absolute -inset-[8%] blur-[80px] md:blur-[115px]"
          style={{
            background:
              "radial-gradient(ellipse 55% 42% at 84% 90%, rgba(45,212,167,0.11) 0%, rgba(45,212,167,0.045) 42%, transparent 72%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Eco esmeralda abajo a la izquierda, apenas insinuado */}
        <div
          className="animate-aurora-c absolute -inset-[8%] blur-[90px] md:blur-[130px]"
          style={{
            background:
              "radial-gradient(ellipse 40% 32% at 8% 94%, rgba(45,212,167,0.06) 0%, transparent 70%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Corredor central: oscurece donde vive el contenido */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 62% 48% at 50% 50%, rgba(4,9,7,0.62) 0%, rgba(4,9,7,0.30) 55%, transparent 85%)",
            mixBlendMode: "multiply",
          }}
        />

        {/* Reticula tipo tablero de caso: solo en el corredor central */}
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.022) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse 75% 55% at 50% 45%, black 15%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 55% at 50% 45%, black 15%, transparent 75%)",
          }}
        />

        {/* Vineta: asienta las esquinas sin apagar las auroras */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(140% 100% at 50% 50%, transparent 55%, rgba(3,6,5,0.55) 100%)",
          }}
        />

        {/* Grano de pelicula */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ mixBlendMode: "overlay" }}
        >
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <filter id="grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="3"
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain)" />
          </svg>
        </div>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
