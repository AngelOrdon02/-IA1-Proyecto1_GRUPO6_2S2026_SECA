import type {
  BitacoraResponse,
  CasoResponse,
  CasosResponse,
  CoartadasResponse,
  ContradiccionesResponse,
  CrearSesionResponse,
  EvidenciasResponse,
  ExaminarResponse,
  ExplicacionResponse,
  InformeResponse,
  InterrogarResponse,
  InvestigarLugarResponse,
  LineaTemporalResponse,
  LugaresResponse,
  MinimosResponse,
  MotivosResponse,
  OportunidadesResponse,
  PistaResponse,
  PuntosResponse,
  RelacionesResponse,
  SaludResponse,
  SesionResponse,
  SospechaResponse,
  SospechososResponse,
  AcusarResponse,
  Sesion,
} from "./types.ts";

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || res.statusText);
  }

  return res.json() as Promise<T>;
}

export const api = {
  salud: () => request<SaludResponse>("/api/salud"),

  casos: () => request<CasosResponse>("/api/casos"),

  casoDetalle: (caso: string) =>
    request<CasoResponse>(`/api/casos/${caso}`),

  casoMinimos: (caso: string) =>
    request<MinimosResponse>(`/api/casos/${caso}/minimos`),

  crearSesion: (caso: string) =>
    request<CrearSesionResponse>("/api/sesiones", {
      method: "POST",
      body: JSON.stringify({ caso }),
    }),

  // Opcional 1: abre una investigacion con un caso elegido al azar en el backend.
  crearSesionAleatoria: () =>
    request<CrearSesionResponse>("/api/sesiones/aleatorio", {
      method: "POST",
    }),

  sesiones: () =>
    request<{ ok: boolean; sesiones: Sesion[] }>("/api/sesiones"),

  sesion: (sesion: string) =>
    request<SesionResponse>(`/api/sesiones/${sesion}`),

  sospechosos: (sesion: string) =>
    request<SospechososResponse>(`/api/sesiones/${sesion}/sospechosos`),

  interrogar: (sesion: string, persona: string) =>
    request<InterrogarResponse>(
      `/api/sesiones/${sesion}/interrogar/${persona}`,
      { method: "POST" },
    ),

  lugares: (sesion: string) =>
    request<LugaresResponse>(`/api/sesiones/${sesion}/lugares`),

  investigarLugar: (sesion: string, lugar: string) =>
    request<InvestigarLugarResponse>(
      `/api/sesiones/${sesion}/lugares/${lugar}`,
      { method: "POST" },
    ),

  evidencias: (sesion: string) =>
    request<EvidenciasResponse>(`/api/sesiones/${sesion}/evidencias`),

  examinarEvidencia: (sesion: string, evidencia: string) =>
    request<ExaminarResponse>(
      `/api/sesiones/${sesion}/evidencias/${evidencia}`,
      { method: "POST" },
    ),

  relaciones: (sesion: string) =>
    request<RelacionesResponse>(`/api/sesiones/${sesion}/relaciones`),

  motivos: (sesion: string) =>
    request<MotivosResponse>(`/api/sesiones/${sesion}/motivos`),

  oportunidades: (sesion: string) =>
    request<OportunidadesResponse>(`/api/sesiones/${sesion}/oportunidades`),

  coartadas: (sesion: string) =>
    request<CoartadasResponse>(`/api/sesiones/${sesion}/coartadas`),

  lineaTemporal: (sesion: string) =>
    request<LineaTemporalResponse>(
      `/api/sesiones/${sesion}/linea-temporal`,
    ),

  contradicciones: (sesion: string) =>
    request<ContradiccionesResponse>(
      `/api/sesiones/${sesion}/contradicciones`,
    ),

  sospecha: (sesion: string) =>
    request<SospechaResponse>(`/api/sesiones/${sesion}/sospecha`),

  pista: (sesion: string) =>
    request<PistaResponse>(`/api/sesiones/${sesion}/pista`, {
      method: "POST",
    }),

  acusar: (sesion: string, acusado: string) =>
    request<AcusarResponse>(`/api/sesiones/${sesion}/acusar`, {
      method: "POST",
      body: JSON.stringify({ acusado }),
    }),

  explicacion: (sesion: string, persona?: string) => {
    const params = persona ? `?persona=${persona}` : "";
    return request<ExplicacionResponse>(
      `/api/sesiones/${sesion}/explicacion${params}`,
    );
  },

  informe: (sesion: string) =>
    request<InformeResponse>(`/api/sesiones/${sesion}/informe`),

  bitacora: (sesion: string) =>
    request<BitacoraResponse>(`/api/sesiones/${sesion}/bitacora`),

  // Opcional 2: aplica un delta de puntuacion a la sesion activa.
  // delta negativo = penalizacion, positivo = bonus.
  registrarPuntos: (sesion: string, delta: number) =>
    request<PuntosResponse>(`/api/sesiones/${sesion}/puntos`, {
      method: "POST",
      body: JSON.stringify({ delta }),
    }),
};

export { ApiError };