import type { ReactNode } from "react";

/**
 * Ambiente de fondo "Noir Aurora".
 *
 * Arquitectura de luz, de arriba hacia abajo en orden de pintado:
 *
 *   1-2. Cortinas de aurora (teal/cian/verde) con `screen`, concentradas en
 *      el tercio superior por mascaras radiales: es la zona del sidebar y la
 *      marca, donde casi no hay texto corrido.
 *   3. Resplandor violeta en la esquina superior derecha: profundidad.
 *   4-5. Resplandores de laton abajo a la derecha (y un eco tenue a la
 *      izquierda): anclan el fondo con el acento dorado de la marca.
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
        {/* Cortina teal, diagonal desde arriba-izquierda */}
        <div
          className="animate-aurora-a absolute -inset-[8%] blur-[85px] md:blur-[122px]"
          style={{
            background:
              "linear-gradient(154deg, transparent 18%, rgba(12,72,61,0.06) 29%, rgba(0,229,255,0.20) 36%, rgba(120,230,200,0.26) 42%, rgba(73,207,158,0.24) 48%, rgba(38,158,119,0.18) 55%, rgba(0,183,255,0.22) 62%, rgba(15,76,65,0.08) 68%, transparent 82%)",
            mixBlendMode: "screen",
            maskImage:
              "radial-gradient(ellipse 92% 62% at 32% 0%, black 25%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 92% 62% at 32% 0%, black 25%, transparent 72%)",
          }}
        />

        {/* Segunda cortina, cian/verde cruzando desde arriba-derecha */}
        <div
          className="animate-aurora-b absolute -inset-[8%] opacity-90 blur-[75px] md:blur-[108px]"
          style={{
            background:
              "linear-gradient(128deg, transparent 28%, rgba(15,82,96,0.06) 38%, rgba(0,183,255,0.18) 43%, rgba(110,220,210,0.22) 48%, rgba(68,197,185,0.18) 52%, rgba(0,229,255,0.16) 57%, rgba(25,105,112,0.10) 62%, transparent 76%)",
            mixBlendMode: "screen",
            maskImage:
              "radial-gradient(ellipse 85% 60% at 68% 4%, black 22%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 85% 60% at 68% 4%, black 22%, transparent 72%)",
          }}
        />

        {/* Violeta tenue, esquina superior derecha */}
        <div
          className="animate-aurora-c absolute -inset-[8%] opacity-70 blur-[110px] md:blur-[160px]"
          style={{
            background:
              "radial-gradient(ellipse 50% 28% at 76% 12%, rgba(89,62,151,0.11) 0%, rgba(57,44,100,0.045) 45%, transparent 82%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Laton calido, abajo a la derecha: ancla con el acento de marca */}
        <div
          className="animate-aurora-b absolute -inset-[8%] blur-[80px] md:blur-[115px]"
          style={{
            background:
              "radial-gradient(ellipse 55% 42% at 84% 90%, rgba(240,180,41,0.13) 0%, rgba(240,180,41,0.05) 42%, transparent 72%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Eco de laton abajo a la izquierda, apenas insinuado */}
        <div
          className="animate-aurora-c absolute -inset-[8%] blur-[90px] md:blur-[130px]"
          style={{
            background:
              "radial-gradient(ellipse 40% 32% at 8% 94%, rgba(240,180,41,0.07) 0%, transparent 70%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Corredor central: oscurece donde vive el contenido */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 62% 48% at 50% 50%, rgba(4,7,11,0.62) 0%, rgba(4,7,11,0.30) 55%, transparent 85%)",
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
              "radial-gradient(140% 100% at 50% 50%, transparent 55%, rgba(3,5,8,0.55) 100%)",
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
