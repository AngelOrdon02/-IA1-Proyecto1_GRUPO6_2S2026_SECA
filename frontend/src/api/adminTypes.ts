import type {
  Sesion,
} from "./types.ts";

export interface AdminCaso {
  Id: string;
  Titulo: string;
  Descripcion: string;
  Dificultad: "facil" | "medio" | "dificil";
  estado: string;
  sospechosos: string;
  evidencias: string;
  lugares: string;
  declaraciones: string;
  reglas: string;
  cumple: boolean;
  archivo: string;
}

export interface AdminSesion extends Sesion {
  pistas: number;
}

export interface AdminCasoResponse {
  ok: boolean;
  casos: AdminCaso[];
}

export interface AdminArchivosResponse {
  ok: boolean;
  archivos: string[];
}

export interface AdminFuenteResponse {
  ok: boolean;
  archivo: string;
  contenido: string;
}

export interface AdminGuardarFuenteResponse {
  ok: boolean;
  archivo: string;
  casos: string[];
}

export interface AdminConteo {
  S?: string;
  E?: string;
  L?: string;
  D?: string;
  R?: string;
}

export interface AdminCrearCasoResponse {
  ok: boolean;
  archivo: string;
  ruta: string;
  caso: string;
  conteo: AdminConteo;
  cumple_minimos: boolean;
  casos: string[];
}

export interface AdminGenerarCasoResponse {
  ok: boolean;
  archivo: string;
  caso: string;
  conteo: AdminConteo;
  cumple_minimos: boolean;
  casos: string[];
}

export interface AdminEjemplo {
  archivo: string;
  id: string;
  titulo: string;
  descripcion: string;
}

export interface AdminEjemplosResponse {
  ok: boolean;
  ejemplos: AdminEjemplo[];
}

export interface AdminEjemploResponse {
  ok: boolean;
  archivo: string;
  contenido: string;
}

export interface AdminRecargarResponse {
  ok: boolean;
  backend: string;
  casos: string[];
}

export interface AdminSesionesResponse {
  ok: boolean;
  sesiones: AdminSesion[];
}

export interface AdminEliminarResponse {
  ok: boolean;
  archivo: string;
}

export interface AdminLimpiarResponse {
  ok: boolean;
  mensaje: string;
}
