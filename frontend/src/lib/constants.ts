export const SECCIONES = [
  { key: "resumen", label: "Resumen del caso" },
  { key: "sospechosos", label: "Sospechosos" },
  { key: "interrogatorios", label: "Interrogatorios" },
  { key: "lugares", label: "Lugares" },
  { key: "evidencias", label: "Evidencias" },
  { key: "relaciones", label: "Relaciones" },
  { key: "analisis", label: "Motivos y oportunidades" },
  { key: "coartadas", label: "Coartadas" },
  { key: "tiempo", label: "Linea temporal" },
  { key: "contradicciones", label: "Contradicciones" },
  { key: "sospecha", label: "Nivel de sospecha" },
  { key: "explicacion", label: "Explicacion logica" },
  { key: "bitacora", label: "Bitacora" },
  { key: "acusacion", label: "Acusacion final" },
] as const;

export type SeccionKey = (typeof SECCIONES)[number]["key"];

export const DIFICULTAD_LABELS: Record<string, string> = {
  facil: "Fácil",
  medio: "Medio",
  dificil: "Difícil",
};

export const ESTADO_LABELS: Record<string, string> = {
  sin_iniciar: "Sin iniciar",
  en_curso: "En curso",
  resuelto: "Resuelto",
  fallido: "Fallido",
};

export const CATEGORIA_LABELS: Record<string, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
  muy_alto: "Muy alto",
};
