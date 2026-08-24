import { useReducer, useCallback } from "react";
import { api } from "@/api/client.ts";
import {
  chatReducer,
  generateId,
  type ChatMessage,
  type ChatState,
  type Pensamiento,
} from "./chatTypes.ts";

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  thinking: null,
  error: null,
};

/**
 * Duracion minima de la fase "pensando", en ms, mas un margen aleatorio.
 *
 * El backend resuelve casi todas las consultas en decenas de milisegundos:
 * sin este suelo, la respuesta aparecia de golpe junto a la accion y no se
 * leia como una deduccion sino como un `console.log`. Reteniendo el
 * resultado poco menos de un segundo, el indicador de razonamiento llega a
 * verse y el hilo adquiere ritmo de conversacion. El jitter evita que la
 * espera se sienta como una barra de progreso falsa siempre igual.
 *
 * No es un `setTimeout` antes de la peticion: la peticion sale de inmediato
 * y solo se retiene la *presentacion*, asi que en una consulta lenta el
 * retardo no suma nada.
 */
const PENSAR_MS = 850;
const PENSAR_JITTER_MS = 550;

/**
 * Presentacion de la espera por accion: la animacion del orbe se elige para
 * que coincida con el verbo — se *escucha* a un sospechoso, se *busca* en un
 * lugar, se *conectan* pistas — y las frases se encadenan mientras dura.
 */
const PENSAMIENTOS: Record<string, Pensamiento> = {
  interrogar: {
    orbe: "listening",
    frases: [
      "Registrando la declaracion",
      "Contrastando con las coartadas conocidas",
    ],
  },
  lugar: {
    orbe: "searching",
    frases: ["Recorriendo el lugar", "Levantando evidencias del sitio"],
  },
  evidencia: {
    orbe: "connecting",
    frases: ["Analizando la evidencia", "Buscando a quien la vincula"],
  },
  pista: {
    orbe: "weaving",
    frases: ["Revisando el expediente", "Buscando un hilo del que tirar"],
  },
  acusar: {
    orbe: "solving",
    frases: [
      "Ejecutando la deduccion",
      "Contrastando tu acusacion con el responsable",
    ],
  },
};

/**
 * Resuelve `tarea` sin dejar que la interfaz responda antes de `PENSAR_MS`.
 *
 * El error se retiene igual que el exito: si un fallo apareciera al instante
 * y una respuesta valida tardara un segundo, el error se leeria como un
 * problema de la interfaz y no del caso.
 */
async function pensando<T>(tarea: Promise<T>): Promise<T> {
  const espera = PENSAR_MS + Math.random() * PENSAR_JITTER_MS;
  const [resultado] = await Promise.all([
    tarea.then(
      (valor) => ({ ok: true as const, valor }),
      (error: unknown) => ({ ok: false as const, error }),
    ),
    new Promise((resolve) => setTimeout(resolve, espera)),
  ]);
  if (!resultado.ok) throw resultado.error;
  return resultado.valor;
}

export function useChat(sesionId: string) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const addMessage = useCallback((message: ChatMessage) => {
    dispatch({ type: "ADD_MESSAGE", message });
  }, []);

  const setLoading = useCallback((loading: boolean, thinking?: Pensamiento) => {
    dispatch({ type: "SET_LOADING", loading, thinking });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", error });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: "CLEAR_MESSAGES" });
  }, []);

  const loadMessages = useCallback((messages: ChatMessage[]) => {
    dispatch({ type: "LOAD_MESSAGES", messages });
  }, []);

  const interrogar = useCallback(
    async (personaId: string, personaNombre: string) => {
      const userMsg: ChatMessage = {
        id: generateId(),
        type: "user_action",
        timestamp: new Date(),
        action: "Interrogar",
        target: personaNombre,
      };
      addMessage(userMsg);
      setLoading(true, PENSAMIENTOS.interrogar);

      try {
        const res = await pensando(api.interrogar(sesionId, personaId));
        const msg: ChatMessage = {
          id: generateId(),
          type: "declaration",
          timestamp: new Date(),
          personaNombre: res.nombre,
          declaraciones: res.declaraciones,
          coartadas: res.coartadas,
        };
        addMessage(msg);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al interrogar");
      } finally {
        setLoading(false);
      }
    },
    [sesionId, addMessage, setLoading, setError],
  );

  const investigarLugar = useCallback(
    async (lugarId: string, lugarNombre: string) => {
      const userMsg: ChatMessage = {
        id: generateId(),
        type: "user_action",
        timestamp: new Date(),
        action: "Investigar lugar",
        target: lugarNombre,
      };
      addMessage(userMsg);
      setLoading(true, PENSAMIENTOS.lugar);

      try {
        const res = await pensando(api.investigarLugar(sesionId, lugarId));
        const placeMsg: ChatMessage = {
          id: generateId(),
          type: "place_investigated",
          timestamp: new Date(),
          lugarNombre: res.nombre,
          descripcion: res.descripcion,
          eventos: res.eventos.map((e) => ({
            HoraTexto: e.HoraTexto,
            Descripcion: e.Descripcion,
          })),
        };
        addMessage(placeMsg);

        if (res.evidencias.length > 0) {
          const evidenceMsg: ChatMessage = {
            id: generateId(),
            type: "evidence_found",
            timestamp: new Date(),
            lugarNombre: res.nombre,
            evidencias: res.evidencias,
          };
          addMessage(evidenceMsg);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al investigar lugar",
        );
      } finally {
        setLoading(false);
      }
    },
    [sesionId, addMessage, setLoading, setError],
  );

  const examinarEvidencia = useCallback(
    async (evidenciaId: string, etiqueta?: string) => {
      const userMsg: ChatMessage = {
        id: generateId(),
        type: "user_action",
        timestamp: new Date(),
        action: "Examinar evidencia",
        // Sin etiqueta se mostraba el identificador crudo al usuario.
        target: etiqueta ?? evidenciaId,
      };
      addMessage(userMsg);
      setLoading(true, PENSAMIENTOS.evidencia);

      try {
        const res = await pensando(
          api.examinarEvidencia(sesionId, evidenciaId),
        );
        const msg: ChatMessage = {
          id: generateId(),
          type: "evidence_examined",
          timestamp: new Date(),
          evidencia: {
            Id: res.evidencia,
            Tipo: res.Tipo,
            Descripcion: res.Descripcion,
            Lugar: res.Lugar,
            Hora: res.Hora,
          },
          vinculos: res.vinculos,
        };
        addMessage(msg);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al examinar evidencia",
        );
      } finally {
        setLoading(false);
      }
    },
    [sesionId, addMessage, setLoading, setError],
  );

  const solicitarPista = useCallback(async () => {
    const userMsg: ChatMessage = {
      id: generateId(),
      type: "user_action",
      timestamp: new Date(),
      action: "Solicitar pista",
      target: "",
    };
    addMessage(userMsg);
    setLoading(true, PENSAMIENTOS.pista);

    try {
      const res = await pensando(api.pista(sesionId));
      const msg: ChatMessage = {
        id: generateId(),
        type: "hint",
        timestamp: new Date(),
        pista: res.pista,
      };
      addMessage(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al solicitar pista");
    } finally {
      setLoading(false);
    }
  }, [sesionId, addMessage, setLoading, setError]);

  const acusar = useCallback(
    async (acusadoId: string, etiqueta?: string) => {
      const userMsg: ChatMessage = {
        id: generateId(),
        type: "user_action",
        timestamp: new Date(),
        action: "Acusar",
        target: etiqueta ?? acusadoId,
      };
      addMessage(userMsg);
      setLoading(true, PENSAMIENTOS.acusar);

      try {
        const res = await pensando(api.acusar(sesionId, acusadoId));
        const msg: ChatMessage = {
          id: generateId(),
          type: "verdict",
          timestamp: new Date(),
          resultado: res.resultado,
        };
        addMessage(msg);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al acusar");
      } finally {
        setLoading(false);
      }
    },
    [sesionId, addMessage, setLoading, setError],
  );

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    thinking: state.thinking,
    error: state.error,
    addMessage,
    setLoading,
    setError,
    clearMessages,
    loadMessages,
    interrogar,
    investigarLugar,
    examinarEvidencia,
    solicitarPista,
    acusar,
  };
}
