import { MorphIcon as Morph } from "morphicons/react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils.ts";

type MorphProps = ComponentProps<typeof Morph>;

interface IconProps extends Omit<MorphProps, "size"> {
  /** Tamaño en px del lado del icono. 16 por defecto, como los lucide inline. */
  size?: number;
}

/**
 * Icono que *transforma* su geometria cuando cambia de estado, en lugar de
 * ser sustituido por otro.
 *
 * morphicons resuelve la similitud optima entre las dos formas (rotacion,
 * escala y traslacion) y las interpola con un muelle, asi que el cambio se
 * lee como un solo objeto moviendose: el chevron gira, la X se pliega desde
 * el icono que la abrio. Sirve exactamente donde una sustitucion instantanea
 * rompe la continuidad — toggles, seleccion, apertura de paneles — y por eso
 * los iconos que nunca cambian siguen siendo `lucide-react`.
 *
 * `strokeWidth` 1.75 iguala el grosor de los iconos estaticos de la interfaz.
 */
export default function MorphIcon({
  size = 16,
  strokeWidth = 1.75,
  className,
  ...props
}: IconProps) {
  return (
    <Morph
      size={size}
      strokeWidth={strokeWidth}
      spring="snappy"
      /* El resto de la interfaz respeta prefers-reduced-motion; el icono
         tambien: con la preferencia activa cambia sin interpolar. */
      reducedMotion="user"
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}
