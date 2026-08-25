import type { OrbState } from "thinking-orbs";
import type {
  Declaracion,
  Coartada,
  Evidencia,
  EvidenciaVinculo,
  Pista,
  Contradiccion,
  NivelSospecha,
  AcusacionResult,
  BitacoraEntry,
  Motivo,
  Pilar,
  Relacion,
  ExplicacionResult,
} from "@/api/types.ts";

export type MessageType =
  | "welcome"
  | "user_action"
  | "declaration"
  | "evidence_found"
  | "evidence_examined"
  | "place_investigated"
  | "hint"
  | "contradiction"
  | "suspicion"
  | "verdict"
  | "motives"
  | "pillars"
  | "relations"
  | "explanation"
  | "system";

export interface BaseMessage {
  id: string;
  type: MessageType;
  timestamp: Date;
}

export interface WelcomeMessage extends BaseMessage {
  type: "welcome";
  casoTitulo: string;
  casoDescripcion: string;
  dificultad: string;
}

export interface UserActionMessage extends BaseMessage {
  type: "user_action";
  action: string;
  target: string;
}

export interface DeclarationMessage extends BaseMessage {
  type: "declaration";
  personaNombre: string;
  declaraciones: Declaracion[];
  coartadas: Coartada[];
}

export interface EvidenceFoundMessage extends BaseMessage {
  type: "evidence_found";
  lugarNombre: string;
  evidencias: Array<{
    Id: string;
    Tipo: string;
    Descripcion: string;
  }>;
}

export interface EvidenceExaminedMessage extends BaseMessage {
  type: "evidence_examined";
  evidencia: Evidencia;
  vinculos: EvidenciaVinculo[];
}

export interface PlaceInvestigatedMessage extends BaseMessage {
  type: "place_investigated";
  lugarNombre: string;
  descripcion: string;
  eventos: Array<{
    HoraTexto: string;
    Descripcion: string;
  }>;
}

export interface HintMessage extends BaseMessage {
  type: "hint";
  pista: Pista;
}

export interface ContradictionMessage extends BaseMessage {
  type: "contradiction";
  contradicciones: Contradiccion[];
}

export interface SuspicionMessage extends BaseMessage {
  type: "suspicion";
  sospecha: NivelSospecha[];
}

export interface VerdictMessage extends BaseMessage {
  type: "verdict";
  resultado: AcusacionResult;
}

export interface MotivesMessage extends BaseMessage {
  type: "motives";
  motivos: Motivo[];
}

export interface PillarsMessage extends BaseMessage {
  type: "pillars";
  pilares: Pilar[];
}

export interface RelationsMessage extends BaseMessage {
  type: "relations";
  relaciones: Relacion[];
}

export interface ExplanationMessage extends BaseMessage {
  type: "explanation";
  explicacion: ExplicacionResult;
}

export interface SystemMessage extends BaseMessage {
  type: "system";
  text: string;
}

export type ChatMessage =
  | WelcomeMessage
  | UserActionMessage
  | DeclarationMessage
  | EvidenceFoundMessage
  | EvidenceExaminedMessage
  | PlaceInvestigatedMessage
  | HintMessage
  | ContradictionMessage
  | SuspicionMessage
  | VerdictMessage
  | MotivesMessage
  | PillarsMessage
  | RelationsMessage
  | ExplanationMessage
  | SystemMessage;

/**
 * Como se presenta la espera de una accion: la animacion del orbe y las
 * frases que la acompañan. Cada accion tiene la suya, de modo que la espera
 * describe lo que el motor esta haciendo y no un "cargando" generico.
 */
export interface Pensamiento {
  orbe: OrbState;
  frases: string[];
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  /** Null cuando no hay consulta en curso. */
  thinking: Pensamiento | null;
  error: string | null;
}

export type ChatAction =
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "SET_LOADING"; loading: boolean; thinking?: Pensamiento }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "CLEAR_MESSAGES" }
  | { type: "LOAD_MESSAGES"; messages: ChatMessage[] };

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.loading,
        thinking: action.loading ? (action.thinking ?? null) : null,
      };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "CLEAR_MESSAGES":
      return { ...state, messages: [], error: null };
    case "LOAD_MESSAGES":
      return { ...state, messages: action.messages, error: null };
    default:
      return state;
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type { BitacoraEntry };
