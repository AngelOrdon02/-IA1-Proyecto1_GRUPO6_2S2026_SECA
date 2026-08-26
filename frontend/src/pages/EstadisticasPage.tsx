import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ArrowLeft,
  Layers,
  Play,
  Trophy,
  Timer,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import AuraBackground from "@/organisms/AuraBackground.tsx";
import { ChatLayout } from "@/templates";
import { Badge, Button, Card, Spinner, EmptyState, MonoText } from "@/atoms";
import { api } from "@/api/client.ts";
import { useSesiones } from "@/hooks";
import type { EstadisticasResponse, MulticasoEstado } from "@/api/types.ts";
import { DIFICULTAD_LABELS } from "@/lib/constants.ts";

/**
 * Opcional 10 del enunciado: modo multicaso con estadisticas de resolucion.
 *
 * Dos mitades:
 *  - Arriba, la campania: recorre los tres casos en orden creciente de
 *    dificultad. El orden y cual toca despues los decide Prolog
 *    (`casos_por_dificultad/1`, `siguiente_caso/2`), no esta pagina.
 *  - Abajo, las estadisticas agregadas por caso y globales.
 *
 * La campania en curso se recuerda en localStorage para que recargar la
 * pagina no obligue a empezar de cero. Si el identificador guardado ya no
 * existe en el servidor, se descarta en silencio.
 */

const CLAVE_CAMPANIA = "logic-detective:campania";

export default function EstadisticasPage() {
  const navigate = useNavigate();
  const { sesiones: sidebarSesiones, titulos, loading: loadingSidebar } =
    useSesiones();

  const [datos, setDatos] = useState<EstadisticasResponse | null>(null);
  const [campania, setCampania] = useState<MulticasoEstado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoading(true);
      const estadisticas = await api.estadisticas();
      setDatos(estadisticas);

      const guardada = localStorage.getItem(CLAVE_CAMPANIA);
      if (guardada) {
        try {
          setCampania(await api.estadoMulticaso(guardada));
        } catch {
          // La campania guardada ya no existe (base reiniciada, por ejemplo).
          localStorage.removeItem(CLAVE_CAMPANIA);
          setCampania(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function iniciarCampania() {
    try {
      setError("");
      const inicio = await api.iniciarMulticaso();
      localStorage.setItem(CLAVE_CAMPANIA, inicio.campania);
      navigate(`/investigacion/${inicio.sesion}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar la campaña");
    }
  }

  async function siguienteCaso() {
    if (!campania) return;
    try {
      setError("");
      const paso = await api.siguienteMulticaso(campania.campania);
      navigate(`/investigacion/${paso.sesion}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo continuar la campaña");
    }
  }

  const globales = datos?.globales;

  return (
    <AuraBackground>
      <ChatLayout
        sesiones={sidebarSesiones}
        titulos={titulos}
        sidebarLoading={loadingSidebar}
        title="Estadísticas de resolución"
        subtitle="Modo multicaso y métricas acumuladas"
        actions={
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </Button>
          </Link>
        }
      >
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
          {error && (
            <p className="rounded-md border border-danger/25 bg-danger/10 px-4 py-2 text-sm text-danger-soft">
              {error}
            </p>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <>
              {/* ---------------------------------------------------------- */}
              {/* Modo multicaso                                             */}
              {/* ---------------------------------------------------------- */}
              <Card tone="raised">
                <div className="mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-accent" />
                  <h2 className="font-semibold text-text">Modo multicaso</h2>
                </div>

                {!campania ? (
                  <EmptyState
                    icon={<Layers className="h-6 w-6" />}
                    message="No hay ninguna campaña en curso"
                    hint="Una campaña recorre todos los casos en orden creciente de dificultad. El orden lo decide el motor de inferencia."
                    action={
                      <Button variant="primary" size="sm" onClick={iniciarCampania}>
                        <Play className="h-4 w-4" />
                        Iniciar campaña
                      </Button>
                    }
                  />
                ) : (
                  <>
                    <div className="mb-4 grid gap-3 sm:grid-cols-4">
                      <Metrica
                        etiqueta="Progreso"
                        valor={`${campania.completados}/${campania.total}`}
                      />
                      <Metrica etiqueta="Aciertos" valor={campania.aciertos} />
                      <Metrica
                        etiqueta="Tasa de éxito"
                        valor={`${campania.tasa_exito}%`}
                      />
                      <Metrica
                        etiqueta="Puntuación"
                        valor={campania.puntuacion_total}
                      />
                    </div>

                    <ol className="mb-4 space-y-2">
                      {campania.sesiones.map((s) => (
                        <li
                          key={s.sesion}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-sunken px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <MonoText className="text-xs">{s.caso}</MonoText>
                            <span className="text-sm text-text">{s.titulo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {s.duracion && (
                              <span className="text-xs text-text-muted">
                                {s.duracion}
                              </span>
                            )}
                            {s.veredicto && (
                              <Badge
                                variant={
                                  s.veredicto === "correcto" ? "resuelto" : "fallido"
                                }
                              >
                                {s.veredicto}
                              </Badge>
                            )}
                            {s.estado === "en_curso" && (
                              <Link to={`/investigacion/${s.sesion}`}>
                                <Button variant="ghost" size="sm">
                                  Continuar
                                </Button>
                              </Link>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>

                    <div className="flex flex-wrap gap-2">
                      {campania.completada ? (
                        <>
                          <Badge variant="resuelto">Campaña completada</Badge>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              localStorage.removeItem(CLAVE_CAMPANIA);
                              setCampania(null);
                            }}
                          >
                            Empezar otra
                          </Button>
                        </>
                      ) : campania.sesion_en_curso ? (
                        <Link to={`/investigacion/${campania.sesion_en_curso}`}>
                          <Button variant="primary" size="sm">
                            Continuar investigación
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="primary" size="sm" onClick={siguienteCaso}>
                          Siguiente caso
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </Card>

              {/* ---------------------------------------------------------- */}
              {/* Métricas globales                                          */}
              {/* ---------------------------------------------------------- */}
              {globales && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <TarjetaMetrica
                    icono={<Trophy className="h-4 w-4" />}
                    etiqueta="Tasa de éxito global"
                    valor={`${globales.tasa_exito}%`}
                    detalle={`${globales.resueltas} de ${globales.resueltas + globales.fallidas} cerradas`}
                  />
                  <TarjetaMetrica
                    icono={<BarChart3 className="h-4 w-4" />}
                    etiqueta="Investigaciones"
                    valor={globales.total}
                    detalle={`${globales.en_curso} en curso`}
                  />
                  <TarjetaMetrica
                    icono={<Timer className="h-4 w-4" />}
                    etiqueta="Tiempo medio"
                    valor={globales.tiempo_medio ?? "—"}
                    detalle="por investigación cerrada"
                  />
                  <TarjetaMetrica
                    icono={<Lightbulb className="h-4 w-4" />}
                    etiqueta="Pistas por partida"
                    valor={globales.promedio_pistas}
                    detalle="promedio"
                  />
                </div>
              )}

              {/* ---------------------------------------------------------- */}
              {/* Desglose por caso                                          */}
              {/* ---------------------------------------------------------- */}
              <Card tone="raised">
                <h2 className="mb-4 font-semibold text-text">
                  Resolución por caso
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                        <th className="py-2 pr-3 font-medium">Caso</th>
                        <th className="py-2 pr-3 font-medium">Dificultad</th>
                        <th className="py-2 pr-3 text-right font-medium">Partidas</th>
                        <th className="py-2 pr-3 text-right font-medium">Aciertos</th>
                        <th className="py-2 pr-3 text-right font-medium">Éxito</th>
                        <th className="py-2 pr-3 text-right font-medium">Pistas</th>
                        <th className="py-2 pr-3 text-right font-medium">Puntos</th>
                        <th className="py-2 text-right font-medium">Tiempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos?.por_caso.map((fila) => (
                        <tr key={fila.caso} className="border-b border-border/50">
                          <td className="py-2 pr-3">
                            <span className="text-text">{fila.titulo}</span>
                            <MonoText className="ml-2 text-xs text-text-dim">
                              {fila.caso}
                            </MonoText>
                          </td>
                          <td className="py-2 pr-3">
                            <Badge
                              variant={
                                fila.dificultad as "facil" | "medio" | "dificil"
                              }
                            >
                              {DIFICULTAD_LABELS[fila.dificultad] ?? fila.dificultad}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-xs">
                            {fila.partidas}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-xs">
                            {fila.aciertos}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-xs">
                            {fila.cerradas ? `${fila.tasa_exito}%` : "—"}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-xs">
                            {fila.pistas_medias ?? "—"}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-xs">
                            {fila.puntuacion_media ?? "—"}
                          </td>
                          <td className="py-2 text-right font-mono text-xs">
                            {fila.tiempo_medio ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {datos && datos.globales.total === 0 && (
                  <p className="mt-4 text-sm text-text-muted">
                    Todavía no se ha jugado ninguna investigación. Los casos
                    aparecen en cero hasta que haya partidas.
                  </p>
                )}
              </Card>

              {/* ---------------------------------------------------------- */}
              {/* Campañas registradas                                       */}
              {/* ---------------------------------------------------------- */}
              {datos && datos.multicaso.campanias > 0 && (
                <Card tone="raised">
                  <h2 className="mb-1 font-semibold text-text">Campañas</h2>
                  <p className="mb-4 text-sm text-text-muted">
                    {datos.multicaso.completadas} completada(s) ·{" "}
                    {datos.multicaso.en_curso} en curso
                  </p>
                  <ul className="space-y-2">
                    {datos.multicaso.detalle.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-sunken px-3 py-2"
                      >
                        <MonoText className="text-xs">{c.id}</MonoText>
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                          <span>
                            {c.cerradas}/{c.orden.length} casos
                          </span>
                          <span>{c.aciertos} acierto(s)</span>
                          {c.puntuacion_media !== null && (
                            <span>{c.puntuacion_media} pts de media</span>
                          )}
                          <Badge
                            variant={
                              c.estado === "completada" ? "resuelto" : "en_curso"
                            }
                          >
                            {c.estado}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}
        </div>
      </ChatLayout>
    </AuraBackground>
  );
}

function Metrica({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string | number;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-sunken px-3 py-2">
      <p className="text-xs text-text-muted">{etiqueta}</p>
      <p className="font-mono text-lg text-text">{valor}</p>
    </div>
  );
}

function TarjetaMetrica({
  icono,
  etiqueta,
  valor,
  detalle,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: string | number;
  detalle: string;
}) {
  return (
    <Card tone="raised">
      <div className="mb-1 flex items-center gap-2 text-text-muted">
        {icono}
        <span className="text-xs">{etiqueta}</span>
      </div>
      <p className="font-mono text-2xl text-text">{valor}</p>
      <p className="mt-1 text-xs text-text-dim">{detalle}</p>
    </Card>
  );
}
