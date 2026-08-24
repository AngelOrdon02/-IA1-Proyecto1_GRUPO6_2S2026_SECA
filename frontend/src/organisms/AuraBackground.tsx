import type { ReactNode } from "react";
import ConstellationField from "./ConstellationField.tsx";

/**
 * Ambiente de fondo de la aplicacion.
 *
 * Orden de pintado, de atras hacia delante:
 *
 *   1-2. Dos cortinas de aurora esmeralda ancladas al tercio superior, donde
 *      casi no hay texto corrido.
 *   3. Contrapunto azul frio en la esquina superior derecha.
 *   4. Malla de nodos enlazados: la unica capa con movimiento propio y la
 *      que da identidad al fondo. Va enmascarada para desvanecerse en la
 *      franja central, que es donde vive el texto.
 *   5. Corredor central en `multiply`: oscurece esa franja y es lo que
 *      garantiza el contraste sin tener que apagar las capas de luz.
 *   6. Vineta y grano.
 *
 * Respecto a la version anterior, todas las intensidades bajan
 * aproximadamente a la mitad y desaparecen la reticula de 72px y el
 * resplandor inferior: el fondo debe leerse como atmosfera, no como
 * decoracion compitiendo con la interfaz. Ninguna parada de color llega a
 * blanco puro — eso era lo que lavaba el texto bajo los blend modes.
 *
 * La capa es `fixed`: no se repinta al hacer scroll ni crece con el
 * contenido. `prefers-reduced-motion` deja las auroras quietas y la malla
 * en un unico fotograma.
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
              "linear-gradient(154deg, transparent 20%, rgba(43,217,199,0.09) 36%, rgba(125,235,200,0.13) 43%, rgba(53,212,156,0.11) 50%, rgba(38,196,166,0.09) 62%, transparent 80%)",
            mixBlendMode: "screen",
            maskImage:
              "radial-gradient(ellipse 92% 58% at 32% 0%, black 20%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 92% 58% at 32% 0%, black 20%, transparent 70%)",
          }}
        />

        {/* Segunda cortina, teal cruzando desde arriba-derecha */}
        <div
          className="animate-aurora-b absolute -inset-[8%] opacity-80 blur-[75px] md:blur-[108px]"
          style={{
            background:
              "linear-gradient(128deg, transparent 30%, rgba(38,196,166,0.08) 43%, rgba(115,226,205,0.11) 48%, rgba(62,196,170,0.08) 54%, transparent 74%)",
            mixBlendMode: "screen",
            maskImage:
              "radial-gradient(ellipse 85% 56% at 68% 4%, black 18%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 85% 56% at 68% 4%, black 18%, transparent 70%)",
          }}
        />

        {/* Azul profundo, esquina superior derecha */}
        <div
          className="animate-aurora-c absolute -inset-[8%] opacity-60 blur-[110px] md:blur-[160px]"
          style={{
            background:
              "radial-gradient(ellipse 50% 28% at 76% 12%, rgba(44,92,138,0.10) 0%, transparent 78%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Malla de nodos: se apaga en la franja de lectura */}
        <div
          className="absolute inset-0"
          style={{
            maskImage:
              "radial-gradient(ellipse 78% 62% at 50% 46%, transparent 8%, rgba(0,0,0,0.45) 46%, black 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 78% 62% at 50% 46%, transparent 8%, rgba(0,0,0,0.45) 46%, black 78%)",
          }}
        >
          <ConstellationField />
        </div>

        {/* Corredor central: oscurece donde vive el contenido */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 62% 48% at 50% 50%, rgba(4,6,5,0.55) 0%, rgba(4,6,5,0.26) 55%, transparent 85%)",
            mixBlendMode: "multiply",
          }}
        />

        {/* Vineta: asienta las esquinas sin apagar las auroras */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(140% 100% at 50% 50%, transparent 58%, rgba(3,5,4,0.5) 100%)",
          }}
        />

        {/* Grano de pelicula, apenas perceptible */}
        <div
          className="absolute inset-0 opacity-[0.035]"
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
