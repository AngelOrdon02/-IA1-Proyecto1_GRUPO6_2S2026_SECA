export interface Caso {
  Id: string;
  Titulo: string;
  Descripcion: string;
  Dificultad: "facil" | "medio" | "dificil";
  estado: "sin_iniciar" | "en_curso" | "resuelto" | "fallido";
}

export interface FichaCaso {
  Titulo: string;
  Descripcion: string;
  Dificultad: string;
  Hecho: string;
  Lugar: string;
  Hora: string;
  HoraTexto: string;
  LugarNombre: string;
  Victima: string;
}

export interface Sesion {
  id: string;
  caso: string;
  iniciada: string;
  estado: "en_curso" | "resuelto" | "fallido";
  pistas: number;
  acusado: string | null;
  veredicto: "correcto" | "incorrecto" | null;
}

export interface Sospechoso {
  Id: string;
  Nombre: string;
  interrogado: boolean;
}

export interface Testigo {
  Id: string;
  Nombre: string;
}

export interface Declaracion {
  Id: string;
  Texto: string;
}

export interface Coartada {
  Nombre: string;
  Lugar: string;
  Hora: string;
  Testigo: string;
  Estado: "valida" | "invalida";
  Motivo: string;
}

export interface InterrogatorioResult {
  persona: string;
  nombre: string;
  declaraciones: Declaracion[];
  coartadas: Coartada[];
}

export interface Lugar {
  Id: string;
  Nombre: string;
  Descripcion: string;
  investigado: boolean;
}

export interface Evidencia {
  Id: string;
  Tipo: string;
  Descripcion: string;
  Lugar: string;
  Hora: string;
}

export interface EvidenciaVinculo {
  Persona: string;
  Nombre: string;
}

export interface ExaminarResult {
  evidencia: string;
  Tipo: string;
  Descripcion: string;
  Lugar: string;
  Hora: string;
  vinculos: EvidenciaVinculo[];
}

export interface InvestigarLugarResult {
  lugar: string;
  nombre: string;
  descripcion: string;
  evidencias: Array<{
    Id: string;
    Tipo: string;
    Descripcion: string;
    Hora: string;
    HoraTexto: string;
  }>;
  eventos: Array<{
    Id: string;
    Hora: string;
    HoraTexto: string;
    Lugar: string;
    Descripcion: string;
  }>;
  conexiones: Array<{ Otro: string; NombreOtro: string }>;
}

export interface Relacion {
  Nombre1: string;
  Tipo: string;
  Nombre2: string;
}

export interface Motivo {
  Nombre: string;
  Tipo: string;
  Descripcion: string;
}

export interface Pilar {
  Nombre: string;
  Acceso: "si" | "no";
  Oportunidad: "si" | "no";
  Motivo: "si" | "no";
  Medios: "si" | "no";
  Coartada: "valida" | "invalida";
}

export interface EventoTemporal {
  Hora: string;
  HoraTexto: string;
  Lugar: string;
  LugarNombre: string;
  Descripcion: string;
}

export interface Contradiccion {
  Tipo: "declaracion_vs_evidencia" | "entre_declaraciones";
  A: string;
  B: string;
  Texto: string;
}

export interface NivelSospecha {
  Nombre: string;
  Puntaje: string;
  Categoria: "bajo" | "medio" | "alto" | "muy_alto";
}

export interface Pista {
  numero: number;
  texto: string | null;
  restantes: number;
}

export interface AcusacionResult {
  acusado: string;
  nombre_acusado: string;
  veredicto: "correcto" | "incorrecto";
  responsable: string;
  nombre_responsable: string;
  puntaje: string;
}

export interface Conclusion {
  Estado: "resuelto" | "inconcluso";
  Responsable: string;
  NombreResponsable: string;
  Puntaje: string;
}

export interface ReglaExplicacion {
  Id: string;
  Nombre: string;
  Descripcion: string;
  Detalle: string;
}

export interface Descarte {
  Persona: string;
  Nombre: string;
  Texto: string;
}

export interface Complice {
  Persona: string;
  Nombre: string;
  Texto: string;
}

export interface ExplicacionResult {
  objetivo: string;
  conclusion: Conclusion | null;
  reglas: ReglaExplicacion[];
  descartes: Descarte[];
  complices: Complice[];
}

export interface BitacoraEntry {
  momento: string;
  accion: string;
  detalle: string;
}

export interface InformeFinal {
  sesion: Sesion;
  ficha: FichaCaso;
  conclusion: Conclusion | null;
  ranking: NivelSospecha[];
  coartadas: Coartada[];
  contradicciones: Contradiccion[];
  complices: Complice[];
  descartes: Descarte[];
  reglas: ReglaExplicacion[];
  bitacora: BitacoraEntry[];
}

export interface SaludResponse {
  ok: boolean;
  backend: string;
  casos: string[];
}

export interface CasosResponse {
  ok: boolean;
  casos: Caso[];
}

export interface CasoResponse {
  ok: boolean;
  ficha: FichaCaso;
}

export interface MinimosResponse {
  ok: boolean;
  conteo: {
    Sospechosos: number;
    Evidencias: number;
    Lugares: number;
    Declaraciones: number;
    Reglas: number;
  };
  cumple: boolean;
}

export interface SesionResponse {
  ok: boolean;
  sesion: Sesion;
}

export interface SospechososResponse {
  ok: boolean;
  sospechosos: Sospechoso[];
}

export interface LugaresResponse {
  ok: boolean;
  lugares: Lugar[];
}

export interface EvidenciasResponse {
  ok: boolean;
  evidencias: Evidencia[];
}

export interface RelacionesResponse {
  ok: boolean;
  relaciones: Relacion[];
}

export interface MotivosResponse {
  ok: boolean;
  motivos: Motivo[];
}

export interface OportunidadesResponse {
  ok: boolean;
  pilares: Pilar[];
}

export interface CoartadasResponse {
  ok: boolean;
  coartadas: Coartada[];
}

export interface LineaTemporalResponse {
  ok: boolean;
  eventos: EventoTemporal[];
}

export interface ContradiccionesResponse {
  ok: boolean;
  contradicciones: Contradiccion[];
}

export interface SospechaResponse {
  ok: boolean;
  sospecha: NivelSospecha[];
}

export interface PistaResponse {
  ok: boolean;
  pista: Pista;
}

export interface AcusarResponse {
  ok: boolean;
  resultado: AcusacionResult;
}

export interface ExplicacionResponse {
  ok: boolean;
  explicacion: ExplicacionResult;
}

export interface InformeResponse {
  ok: boolean;
  informe: InformeFinal;
}

export interface BitacoraResponse {
  ok: boolean;
  bitacora: BitacoraEntry[];
}

export interface InterrogarResponse {
  ok: boolean;
  persona: string;
  nombre: string;
  declaraciones: Declaracion[];
  coartadas: Coartada[];
}

export interface InvestigarLugarResponse {
  ok: boolean;
  lugar: string;
  nombre: string;
  descripcion: string;
  evidencias: InvestigarLugarResult["evidencias"];
  eventos: InvestigarLugarResult["eventos"];
  conexiones: InvestigarLugarResult["conexiones"];
}

export interface ExaminarResponse {
  ok: boolean;
  evidencia: string;
  Tipo: string;
  Descripcion: string;
  Lugar: string;
  Hora: string;
  vinculos: EvidenciaVinculo[];
}

export interface CrearSesionResponse {
  ok: boolean;
  sesion: string;
}

export interface GrafoNodo {
  id: string;
  label: string;
  tipo: "sospechoso" | "persona" | "evidencia";
  puntaje?: number;
  categoria?: "bajo" | "medio" | "alto" | "muy_alto";
  interrogado?: boolean;
  rol?: string;
  subtipo?: string;
  descripcion?: string;
  lugar?: string;
  hora?: string;
}

export interface GrafoEnlace {
  origen: string;
  destino: string;
  tipo: "evidencia_vinculo" | "relacion_personal" | "testigo_coartada";
  etiqueta: string;
}

export interface GrafoData {
  sesion: string;
  caso: string;
  nodos: GrafoNodo[];
  enlaces: GrafoEnlace[];
}

export interface GrafoResponse {
  ok: boolean;
  grafo: GrafoData;
}

export interface HistorialSesion {
  id: string;
  caso: string;
  caso_titulo: string;
  caso_dificultad: "facil" | "medio" | "dificil";
  iniciada: string;
  cerrada: string | null;
  estado: "en_curso" | "resuelto" | "fallido";
  acusado: string | null;
  nombre_acusado: string | null;
  responsable_real: string;
  veredicto: "correcto" | "incorrecto" | null;
  puntaje_sospecha: string;
  pistas: number;
  total_acciones: number;
  total_descubrimientos: number;
  duracion_segundos: number | null;
  duracion_texto: string;
}

export interface HistorialEstadisticas {
  total: number;
  resueltas: number;
  fallidas: number;
  en_curso: number;
  tasa_exito: number;
  promedio_pistas: number;
  por_caso: Array<{
    caso: string;
    total: number;
    correctas: number;
    incorrectas: number;
    en_curso: number;
  }>;
}

export interface HistorialResponse {
  ok: boolean;
  sesiones: HistorialSesion[];
  estadisticas: HistorialEstadisticas;
}
