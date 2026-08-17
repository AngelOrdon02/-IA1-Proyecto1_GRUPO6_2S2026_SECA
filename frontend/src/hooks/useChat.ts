import { useReducer, useCallback } from "react";
import { api } from "@/api/client.ts";
import {
  chatReducer,
  generateId,
  type ChatMessage,
  type ChatState,
} from "./chatTypes.ts";

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

export function useChat(sesionId: string) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const addMessage = useCallback((message: ChatMessage) => {
    dispatch({ type: "ADD_MESSAGE", message });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", loading });
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
      setLoading(true);

      try {
        const res = await api.interrogar(sesionId, personaId);
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
      setLoading(true);

      try {
        const res = await api.investigarLugar(sesionId, lugarId);
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
      setLoading(true);

      try {
        const res = await api.examinarEvidencia(sesionId, evidenciaId);
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
    setLoading(true);

    try {
      const res = await api.pista(sesionId);
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
      setLoading(true);

      try {
        const res = await api.acusar(sesionId, acusadoId);
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
