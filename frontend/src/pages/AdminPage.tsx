import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  FileJson,
  Plus,
  Trash2,
  RefreshCw,
  Database,
  LogOut,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import AuraBackground from "@/organisms/AuraBackground.tsx";
import {
  Card,
  Badge,
  Button,
  Input,
  TextArea,
  Select,
  Spinner,
  EmptyState,
  MonoText,
  SectionHeading,
} from "@/atoms";
import { BrandLogo } from "@/molecules";
import { adminApi } from "@/api/adminClient.ts";
import type { AdminCaso, AdminSesion, AdminEjemplo } from "@/api/adminTypes.ts";
import { DIFICULTAD_LABELS, ESTADO_LABELS } from "@/lib/constants.ts";

export default function AdminPage() {
  const navigate = useNavigate();
  const [casos, setCasos] = useState<AdminCaso[]>([]);
  const [sesiones, setSesiones] = useState<AdminSesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCrear, setShowCrear] = useState(false);
  // Opcional 9: generador de casos desde JSON.
  const [showGenerar, setShowGenerar] = useState(false);
  const [jsonCaso, setJsonCaso] = useState("");
  const [ejemplos, setEjemplos] = useState<AdminEjemplo[]>([]);
  const [mensajeGenerar, setMensajeGenerar] = useState<string>("");
  const [generando, setGenerando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string>("");
  const [nuevoCaso, setNuevoCaso] = useState({
    caso: "",
    titulo: "",
    descripcion: "",
    dificultad: "medio",
  });

  useEffect(() => {
    if (!adminApi.isLoggedIn()) {
      navigate("/admin/login");
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setErrorMensaje("");
      const [casosRes, sesionesRes, ejemplosRes] = await Promise.all([
        adminApi.casos(),
        adminApi.sesiones(),
        adminApi.ejemplos(),
      ]);
      setCasos(casosRes.casos);
      setSesiones(sesionesRes.sesiones);
      setEjemplos(ejemplosRes.ejemplos);
    } catch {
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  }

  // El caso nuevo nace como plantilla vacia: solo pide los cuatro campos de la
  // ficha y el resto (personas, evidencias, declaraciones, reglas) se rellena
  // en el editor, asi que se abre ahi directamente al crearlo.
  async function handleCrear() {
    setErrorMensaje("");
    setCreando(true);
    try {
      const res = await adminApi.crearCaso(nuevoCaso);
      setShowCrear(false);
      setNuevoCaso({
        caso: "",
        titulo: "",
        descripcion: "",
        dificultad: "medio",
      });
      navigate(`/admin/fuente/${res.archivo}`);
    } catch (e) {
      setErrorMensaje(e instanceof Error ? e.message : "Error al crear caso");
    } finally {
      setCreando(false);
    }
  }

  // Carga uno de los JSON de datos/ejemplos/ en el area de texto.
  async function handleCargarEjemplo(archivo: string) {
    setErrorMensaje("");
    setMensajeGenerar("");
    try {
      const res = await adminApi.leerEjemplo(archivo);
      setJsonCaso(res.contenido);
    } catch (e) {
      setErrorMensaje(
        e instanceof Error ? e.message : "Error al leer el ejemplo",
      );
    }
  }

  // Opcional 9: envia el JSON al generador y recarga el listado.
  async function handleGenerarJson() {
    setMensajeGenerar("");
    setErrorMensaje("");
    let datos: unknown;
    try {
      datos = JSON.parse(jsonCaso);
    } catch {
      setErrorMensaje("El texto no es JSON válido.");
      return;
    }
    setGenerando(true);
    try {
      const res = await adminApi.generarCasoJson(datos);
      const c = res.conteo;
      setMensajeGenerar(
        `Caso ${res.caso} generado en ${res.archivo} ` +
          `(${c.S ?? 0} sospechosos, ${c.E ?? 0} evidencias, ${c.L ?? 0} lugares, ` +
          `${c.D ?? 0} declaraciones, ${c.R ?? 0} reglas). ` +
          (res.cumple_minimos
            ? "Cumple los mínimos del enunciado."
            : "Aviso: aún no cumple los mínimos del enunciado."),
      );
      setJsonCaso("");
      loadData();
    } catch (e) {
      setErrorMensaje(
        e instanceof Error ? e.message : "Error al generar el caso",
      );
    } finally {
      setGenerando(false);
    }
  }

  async function handleEliminar(archivo: string) {
    if (!confirm(`¿Eliminar ${archivo}? Se guardará un respaldo.`)) return;
    try {
      setErrorMensaje("");
      await adminApi.eliminarCaso(archivo);
      loadData();
    } catch (e) {
      setErrorMensaje(e instanceof Error ? e.message : "Error al eliminar caso");
    }
  }

  async function handleRecargar() {
    try {
      setErrorMensaje("");
      await adminApi.recargar();
      loadData();
    } catch (e) {
      setErrorMensaje(e instanceof Error ? e.message : "Error al recargar Prolog");
    }
  }

  async function handleLimpiar() {
    if (!confirm("¿Borrar todo el historial de sesiones?")) return;
    try {
      setErrorMensaje("");
      await adminApi.limpiarSesiones();
      loadData();
    } catch (e) {
      setErrorMensaje(e instanceof Error ? e.message : "Error al limpiar sesiones");
    }
  }

  function handleLogout() {
    adminApi.logout();
    navigate("/admin/login");
  }

  if (loading) {
    return (
      <AuraBackground>
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner size="lg" label="Cargando panel" />
        </div>
      </AuraBackground>
    );
  }

  return (
    <AuraBackground>
      <div className="min-h-dvh">
        <header className="sticky top-0 z-20 border-b border-border bg-glass backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-5 py-3.5 sm:px-8">
            <BrandLogo />
            <span className="ml-1 rounded-md border border-accent/25 bg-accent/12 px-2 py-0.5 text-xs font-semibold text-accent-soft">
              Admin
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Ir a la app</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleRecargar}>
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Recargar Prolog</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
          {errorMensaje && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-soft">
              <span>{errorMensaje}</span>
              <button
                type="button"
                onClick={() => setErrorMensaje("")}
                className="text-xs text-text-dim hover:text-text"
              >
                X
              </button>
            </div>
          )}

          {/* Casos */}
          <section className="mb-12">
            <SectionHeading
              icon={FileText}
              title="Casos cargados"
              count={casos.length}
              action={
                <span className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowGenerar(!showGenerar)}
                  >
                    <FileJson className="h-4 w-4" />
                    Generar desde JSON
                  </Button>
                  <Button
                    variant={showCrear ? "ghost" : "primary"}
                    size="sm"
                    onClick={() => setShowCrear(!showCrear)}
                  >
                    <Plus className="h-4 w-4" />
                    Nuevo caso
                  </Button>
                </span>
              }
            />

            {/* Opcional 9: motor de casos desde JSON */}
            {showGenerar && (
              <Card tone="raised" className="mb-4 animate-fade-up">
                <h3 className="mb-1 font-semibold text-text">
                  Generar caso desde JSON
                </h3>
                <p className="mb-3 text-sm text-text-muted">
                  Pega la descripción del caso (personas, lugares, evidencias,
                  declaraciones, coartadas, motivos, medios, relaciones y
                  reglas). El servidor la traduce a hechos Prolog, valida la
                  sintaxis y carga el caso en el motor.
                </p>
                {ejemplos.length > 0 && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-text-dim">
                      Cargar un ejemplo:
                    </span>
                    {ejemplos.map((ej) => (
                      <Button
                        key={ej.archivo}
                        variant="ghost"
                        size="sm"
                        title={ej.descripcion || ej.archivo}
                        onClick={() => handleCargarEjemplo(ej.archivo)}
                      >
                        <FileJson className="h-3.5 w-3.5" />
                        {ej.titulo}
                      </Button>
                    ))}
                  </div>
                )}
                <TextArea
                  label="JSON del caso"
                  value={jsonCaso}
                  onChange={(e) => setJsonCaso(e.target.value)}
                  placeholder='{"id": "caso4", "titulo": "…", "personas": […], …}'
                  rows={12}
                  className="font-mono text-xs"
                />
                {mensajeGenerar && (
                  <p className="mt-3 text-sm text-success-soft">
                    {mensajeGenerar}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerarJson}
                    disabled={generando || !jsonCaso.trim()}
                  >
                    {generando && <Spinner size="sm" />}
                    Generar y cargar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGenerar(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </Card>
            )}

            {showCrear && (
              <Card tone="raised" className="mb-4 animate-fade-up">
                <h3 className="mb-1 font-semibold text-text">
                  Crear caso nuevo
                </h3>
                <p className="mb-4 text-sm text-text-muted">
                  Estos cuatro campos son solo la ficha del caso. Al crearlo se
                  genera un archivo Prolog con la plantilla completa (personas,
                  lugares, evidencias, declaraciones y reglas comentadas) y se
                  abre el editor para rellenarlo. Si prefieres describir el caso
                  entero de una vez, usa <strong>Generar desde JSON</strong>.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Identificador"
                    value={nuevoCaso.caso}
                    onChange={(e) =>
                      setNuevoCaso({ ...nuevoCaso, caso: e.target.value })
                    }
                    placeholder="caso4_universidad"
                    hint="Minúscula inicial, solo letras, números y guion bajo (3 a 31). Se usa como nombre del archivo Prolog."
                  />
                  <Input
                    label="Título"
                    value={nuevoCaso.titulo}
                    onChange={(e) =>
                      setNuevoCaso({ ...nuevoCaso, titulo: e.target.value })
                    }
                    placeholder="El expediente perdido"
                  />
                  <TextArea
                    label="Descripción"
                    value={nuevoCaso.descripcion}
                    onChange={(e) =>
                      setNuevoCaso({
                        ...nuevoCaso,
                        descripcion: e.target.value,
                      })
                    }
                    placeholder="Contexto del incidente"
                    className="md:col-span-2"
                  />
                  <Select
                    label="Dificultad"
                    value={nuevoCaso.dificultad}
                    onChange={(e) =>
                      setNuevoCaso({ ...nuevoCaso, dificultad: e.target.value })
                    }
                    options={[
                      { value: "facil", label: "Fácil" },
                      { value: "medio", label: "Medio" },
                      { value: "dificil", label: "Difícil" },
                    ]}
                  />
                </div>
                <div className="mt-5 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCrear}
                    disabled={
                      creando || !nuevoCaso.caso.trim() || !nuevoCaso.titulo.trim()
                    }
                  >
                    {creando && <Spinner size="sm" />}
                    Crear y editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCrear(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </Card>
            )}

            {casos.length === 0 ? (
              <EmptyState
                icon={<FileText />}
                message="Sin casos"
                hint="Crea uno o coloca un archivo .pl en la carpeta de casos."
              />
            ) : (
              <div className="space-y-2">
                {casos.map((c) => (
                  <div
                    key={c.Id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4"
                  >
                    <div className="min-w-[14rem] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-text">
                          {c.Titulo}
                        </span>
                        <Badge variant={c.Dificultad}>
                          {DIFICULTAD_LABELS[c.Dificultad] ?? c.Dificultad}
                        </Badge>
                        <Badge variant={c.cumple ? "resuelto" : "fallido"}>
                          {c.cumple ? "Cumple" : "Incompleto"}
                        </Badge>
                      </div>
                      <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-dim">
                        <Metrica label="Sospechosos" valor={c.sospechosos} />
                        <Metrica label="Evidencias" valor={c.evidencias} />
                        <Metrica label="Lugares" valor={c.lugares} />
                        <Metrica label="Declaraciones" valor={c.declaraciones} />
                        <Metrica label="Reglas" valor={c.reglas} />
                      </dl>
                      {c.archivo && (
                        <MonoText className="mt-1.5 block">{c.archivo}</MonoText>
                      )}
                    </div>

                    {c.archivo && (
                      <div className="flex shrink-0 gap-2">
                        <Link to={`/admin/fuente/${c.archivo}`}>
                          <Button variant="secondary" size="sm">
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Eliminar ${c.archivo}`}
                          onClick={() => handleEliminar(c.archivo)}
                          className="text-danger-soft hover:border-danger/50 hover:text-danger-soft"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sesiones */}
          <section>
            <SectionHeading
              icon={Database}
              title="Historial de sesiones"
              count={sesiones.length}
              action={
                sesiones.length > 0 ? (
                  <Button variant="ghost" size="sm" onClick={handleLimpiar}>
                    <Trash2 className="h-4 w-4" />
                    Limpiar historial
                  </Button>
                ) : undefined
              }
            />

            {sesiones.length === 0 ? (
              <EmptyState icon={<Database />} message="Sin sesiones" />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                {sesiones.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-5 py-3.5 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-text">{s.caso}</span>
                      <p className="text-xs text-text-dim">
                        {new Date(s.iniciada).toLocaleString("es-GT")} · Pistas
                        usadas: {s.pistas}
                      </p>
                    </div>
                    <Badge
                      variant={s.estado as "en_curso" | "resuelto" | "fallido"}
                    >
                      {ESTADO_LABELS[s.estado] ?? s.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AuraBackground>
  );
}

function Metrica({
  label,
  valor,
}: {
  label: string;
  valor: string | number;
}) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <dt>{label}</dt>
      <dd className="font-mono font-semibold tabular-nums text-text-muted">
        {valor}
      </dd>
    </span>
  );
}
