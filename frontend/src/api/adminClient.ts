import type {
  AdminCasoResponse,
  AdminArchivosResponse,
  AdminFuenteResponse,
  AdminGuardarFuenteResponse,
  AdminCrearCasoResponse,
  AdminRecargarResponse,
  AdminSesionesResponse,
  AdminEliminarResponse,
  AdminLimpiarResponse,
} from "./adminTypes.ts";

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getAuthHeader(): string | undefined {
  const creds = sessionStorage.getItem("admin_auth");
  if (creds) return `Basic ${creds}`;
  return undefined;
}

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const auth = getAuthHeader();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (auth) headers["Authorization"] = auth;

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    sessionStorage.removeItem("admin_auth");
    throw new ApiError(401, "No autorizado");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || res.statusText);
  }

  return res.json() as Promise<T>;
}

export const adminApi = {
  login: (user: string, pass: string) => {
    const creds = btoa(`${user}:${pass}`);
    sessionStorage.setItem("admin_auth", creds);
    return request<{ ok: boolean }>("/api/admin/casos").then(() => true);
  },

  logout: () => {
    sessionStorage.removeItem("admin_auth");
  },

  isLoggedIn: () => !!sessionStorage.getItem("admin_auth"),

  casos: () => request<AdminCasoResponse>("/api/admin/casos"),

  archivos: () => request<AdminArchivosResponse>("/api/admin/archivos"),

  leerFuente: (archivo: string) =>
    request<AdminFuenteResponse>(`/api/admin/fuente/${archivo}`),

  guardarFuente: (archivo: string, contenido: string) =>
    request<AdminGuardarFuenteResponse>(`/api/admin/fuente/${archivo}`, {
      method: "POST",
      body: JSON.stringify({ contenido }),
    }),

  crearCaso: (data: {
    caso: string;
    titulo: string;
    descripcion: string;
    dificultad: string;
  }) =>
    request<AdminCrearCasoResponse>("/api/admin/casos", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Opcional 9: genera un caso completo a partir de su descripcion en JSON.
  generarCasoJson: (datos: unknown) =>
    request<{
      ok: boolean;
      archivo: string;
      caso: string;
      cumple_minimos: boolean;
      casos: string[];
    }>("/api/admin/casos/generar", {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  // Opcional 9: genera un caso a partir de un CSV. El servidor lo traduce a la
  // misma estructura del generador JSON, asi que comparten validacion.
  generarCasoCsv: (contenido: string) =>
    request<{
      ok: boolean;
      archivo: string;
      caso: string;
      cumple_minimos: boolean;
      casos: string[];
    }>("/api/admin/casos/generar-csv", {
      method: "POST",
      body: JSON.stringify({ contenido }),
    }),

  // Traduce el CSV y devuelve el conteo sin escribir nada, para poder
  // comprobar el archivo antes de generar el caso.
  previsualizarCsv: (contenido: string) =>
    request<{
      ok: boolean;
      conteo: {
        sospechosos: number;
        evidencias: number;
        lugares: number;
        declaraciones: number;
        reglas: number;
      };
    }>("/api/admin/casos/previsualizar-csv", {
      method: "POST",
      body: JSON.stringify({ contenido }),
    }),

  eliminarCaso: (archivo: string) =>
    request<AdminEliminarResponse>("/api/admin/casos/eliminar", {
      method: "POST",
      body: JSON.stringify({ archivo }),
    }),

  recargar: () =>
    request<AdminRecargarResponse>("/api/admin/recargar", {
      method: "POST",
    }),

  sesiones: () => request<AdminSesionesResponse>("/api/admin/sesiones"),

  limpiarSesiones: () =>
    request<AdminLimpiarResponse>("/api/admin/sesiones/limpiar", {
      method: "POST",
    }),
};

export { ApiError };
