import { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client.ts";
import type { Sesion } from "@/api/types.ts";

interface UseSesionesReturn {
  sesiones: Sesion[];
  /** Id de caso -> titulo legible, para no mostrar "caso1" en la barra lateral. */
  titulos: Record<string, string>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Historial de investigaciones.
 *
 * La version anterior consultaba los casos, descartaba el resultado y hacia
 * `setSesiones([])`, asi que la barra lateral aparecia siempre vacia.
 */
export function useSesiones(): UseSesionesReturn {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [titulos, setTitulos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSesiones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [sesionesRes, casosRes] = await Promise.all([
        api.sesiones(),
        api.casos().catch(() => null),
      ]);

      setSesiones(sesionesRes.sesiones);

      if (casosRes) {
        setTitulos(
          Object.fromEntries(casosRes.casos.map((c) => [c.Id, c.Titulo])),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar sesiones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSesiones();
  }, [fetchSesiones]);

  return { sesiones, titulos, loading, error, refetch: fetchSesiones };
}
