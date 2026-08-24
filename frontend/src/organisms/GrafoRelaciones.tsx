import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Link as LinkIcon,
  HelpCircle,
} from "lucide-react";
import { Badge, Spinner, Button, MonoText, EmptyState, MorphIcon } from "@/atoms";
import { ICON } from "@/lib/icons.ts";
import { cn } from "@/lib/utils.ts";
import { api } from "@/api/client.ts";
import type { GrafoData, GrafoNodo } from "@/api/types.ts";
import { CATEGORIA_LABELS } from "@/lib/constants.ts";

interface GrafoRelacionesProps {
  sesionId: string;
  refreshKey?: number;
  compact?: boolean;
  className?: string;
}

interface PosicionNodo {
  x: number;
  y: number;
}

export default function GrafoRelaciones({
  sesionId,
  refreshKey = 0,
  compact = false,
  className = "",
}: GrafoRelacionesProps) {
  const [data, setData] = useState<GrafoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"todos" | "sospechoso" | "evidencia">("todos");
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Posiciones manuales arrastrables por nodo
  const [nodePositions, setNodePositions] = useState<Record<string, PosicionNodo>>({});
  const [draggingNode, setDraggingNode] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const cargarGrafo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.grafo(sesionId);
      setData(res.grafo);
    } catch {
      setError("No se pudo cargar el grafo de relaciones.");
    } finally {
      setLoading(false);
    }
  }, [sesionId]);

  useEffect(() => {
    cargarGrafo();
  }, [cargarGrafo, refreshKey]);

  // Nodos y enlaces filtrados
  const { nodosVisibles, enlacesVisibles } = useMemo(() => {
    if (!data) return { nodosVisibles: [], enlacesVisibles: [] };

    let nv = data.nodos;
    if (filterType !== "todos") {
      nv = data.nodos.filter((n) => n.tipo === filterType);
    }

    const idsVisibles = new Set(nv.map((n) => n.id));
    const ev = data.enlaces.filter(
      (e) => idsVisibles.has(e.origen) && idsVisibles.has(e.destino),
    );

    return { nodosVisibles: nv, enlacesVisibles: ev };
  }, [data, filterType]);

  // Inicializar posiciones organizadas (layout circular / bipartito)
  useEffect(() => {
    if (!data || nodosVisibles.length === 0) return;

    const width = compact ? 500 : 800;
    const height = compact ? 400 : 600;
    const cx = width / 2;
    const cy = height / 2;

    const sospechosos = nodosVisibles.filter((n) => n.tipo === "sospechoso" || n.tipo === "persona");
    const evidencias = nodosVisibles.filter((n) => n.tipo === "evidencia");

    const newPos: Record<string, PosicionNodo> = {};

    if (evidencias.length > 0 && sospechosos.length > 0) {
      // Layout de 2 círculos concéntricos: Sospechosos en el centro, Evidencias en el exterior
      const radioSospechosos = Math.min(width, height) * 0.22;
      const radioEvidencias = Math.min(width, height) * 0.40;

      sospechosos.forEach((s, idx) => {
        const angulo = (2 * Math.PI * idx) / sospechosos.length - Math.PI / 2;
        newPos[s.id] = {
          x: cx + radioSospechosos * Math.cos(angulo),
          y: cy + radioSospechosos * Math.sin(angulo),
        };
      });

      evidencias.forEach((e, idx) => {
        const angulo = (2 * Math.PI * idx) / evidencias.length - Math.PI / 2;
        newPos[e.id] = {
          x: cx + radioEvidencias * Math.cos(angulo),
          y: cy + radioEvidencias * Math.sin(angulo),
        };
      });
    } else {
      // Círculo único
      const radio = Math.min(width, height) * 0.35;
      nodosVisibles.forEach((n, idx) => {
        const angulo = (2 * Math.PI * idx) / nodosVisibles.length - Math.PI / 2;
        newPos[n.id] = {
          x: cx + radio * Math.cos(angulo),
          y: cy + radio * Math.sin(angulo),
        };
      });
    }

    setNodePositions((prev) => ({ ...newPos, ...prev }));
  }, [data, nodosVisibles, compact]);

  const selectedNode = useMemo(
    () => nodosVisibles.find((n) => n.id === selectedNodeId) ?? null,
    [nodosVisibles, selectedNodeId],
  );

  const connectedNodes = useMemo(() => {
    if (!selectedNodeId || !data) return new Set<string>();
    const set = new Set<string>([selectedNodeId]);
    data.enlaces.forEach((e) => {
      if (e.origen === selectedNodeId) set.add(e.destino);
      if (e.destino === selectedNodeId) set.add(e.origen);
    });
    return set;
  }, [selectedNodeId, data]);

  // Manejo de drag de nodos y pan del canvas
  const handleMouseDownSvg = (e: React.MouseEvent) => {
    if (draggingNode) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMoveSvg = (e: React.MouseEvent) => {
    if (draggingNode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = (e.clientX - rect.left - pan.x) / zoom;
      const svgY = (e.clientY - rect.top - pan.y) / zoom;
      setNodePositions((prev) => ({
        ...prev,
        [draggingNode]: { x: svgX, y: svgY },
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUpSvg = () => {
    setIsPanning(false);
    setDraggingNode(null);
  };

  const handleZoom = (delta: number) => {
    setZoom((z) => Math.max(0.4, Math.min(2.5, z + delta)));
  };

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNodeId(null);
  }, []);

  /* El modo expandido es un modal real, no un `fixed` dentro del panel: el
     `backdrop-filter` del panel del expediente crea un bloque contenedor, asi
     que un `position: fixed` descendiente se anclaba al panel y la "pantalla
     completa" ocupaba una columna de 400px. Se monta con un portal en <body>,
     con Escape para salir y el scroll del documento bloqueado mientras dura. */
  useEffect(() => {
    if (!fullscreen) return;
    handleReset();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
    }
    document.addEventListener("keydown", onKey);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [fullscreen, handleReset]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="md" label="Cargando grafo de relaciones" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={<HelpCircle />}
        message="No se pudo cargar el grafo"
        hint="Intenta refrescar la sesión."
        action={
          <Button variant="secondary" size="sm" onClick={cargarGrafo}>
            Reintentar
          </Button>
        }
      />
    );
  }

  const width = compact ? 500 : 800;
  const height = compact ? 400 : 600;

  const tarjeta = (
    <div
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-surface-2",
        fullscreen ? "h-full w-full shadow-overlay" : className,
      )}
    >
      {/* Barra de Controles Superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-text">
            Red de Vínculos y Evidencias
          </span>
          <Badge variant="info">
            {nodosVisibles.length} nodos · {enlacesVisibles.length} enlaces
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Filtros */}
          <div className="flex items-center rounded-lg border border-border bg-surface-2 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterType("todos")}
              className={`rounded px-2 py-1 transition-colors ${
                filterType === "todos"
                  ? "bg-accent/20 font-medium text-accent-soft"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterType("sospechoso")}
              className={`rounded px-2 py-1 transition-colors ${
                filterType === "sospechoso"
                  ? "bg-accent/20 font-medium text-accent-soft"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Personas
            </button>
            <button
              type="button"
              onClick={() => setFilterType("evidencia")}
              className={`rounded px-2 py-1 transition-colors ${
                filterType === "evidencia"
                  ? "bg-accent/20 font-medium text-accent-soft"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Evidencias
            </button>
          </div>

          {/* Zoom & Reset */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleZoom(0.2)}
              title="Acercar"
              className="rounded-lg p-1.5 text-text-dim hover:bg-surface-hover hover:text-text"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom(-0.2)}
              title="Alejar"
              className="rounded-lg p-1.5 text-text-dim hover:bg-surface-hover hover:text-text"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Restablecer vista"
              className="rounded-lg p-1.5 text-text-dim hover:bg-surface-hover hover:text-text"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            {fullscreen && (
              <kbd className="ml-1 rounded-xs border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-text-dim">
                Esc
              </kbd>
            )}
            <button
              type="button"
              onClick={() => setFullscreen(!fullscreen)}
              aria-expanded={fullscreen}
              title={
                fullscreen
                  ? "Salir de pantalla completa (Esc)"
                  : "Ver en pantalla completa"
              }
              className="rounded-sm p-1.5 text-text-dim hover:bg-surface-hover hover:text-text"
            >
              <MorphIcon
                icon={fullscreen ? ICON.minimize : ICON.maximize}
                size={16}
                className={fullscreen ? "text-accent" : undefined}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas del Grafo SVG */}
      <div
        ref={containerRef}
        className="relative flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
        style={{ minHeight: fullscreen ? 0 : compact ? "320px" : "460px" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full select-none"
          onMouseDown={handleMouseDownSvg}
          onMouseMove={handleMouseMoveSvg}
          onMouseUp={handleMouseUpSvg}
          onMouseLeave={handleMouseUpSvg}
        >
          {/* Patrón de fondo sutil (Grid) */}
          <defs>
            <pattern
              id="graph-grid"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.06)" />
            </pattern>

            {/* Gradientes y filtros para nodos */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <rect width="100%" height="100%" fill="url(#graph-grid)" />

          {/* Grupo transformable con Zoom y Pan */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* 1. ENLACES (LÍNEAS) */}
            {enlacesVisibles.map((enlace, idx) => {
              const posOrigen = nodePositions[enlace.origen];
              const posDestino = nodePositions[enlace.destino];
              if (!posOrigen || !posDestino) return null;

              const isHighlighted =
                selectedNodeId === enlace.origen ||
                selectedNodeId === enlace.destino;
              const isDimmed =
                selectedNodeId !== null && !isHighlighted;

              // Color y estilo por tipo de enlace
              const isEvidencia = enlace.tipo === "evidencia_vinculo";
              const isRelacion = enlace.tipo === "relacion_personal";
              const isCoartada = enlace.tipo === "testigo_coartada";

              let strokeColor = "rgba(100, 116, 139, 0.4)";
              let strokeDasharray = "none";
              let strokeWidth = 1.5;

              if (isEvidencia) {
                strokeColor = isHighlighted ? "#2dd4a7" : "rgba(45, 212, 167, 0.45)";
                strokeWidth = isHighlighted ? 2.5 : 1.8;
              } else if (isRelacion) {
                strokeColor = isHighlighted ? "#5db6ee" : "rgba(93, 182, 238, 0.45)";
                strokeDasharray = "4 3";
                strokeWidth = isHighlighted ? 2.2 : 1.5;
              } else if (isCoartada) {
                strokeColor = isHighlighted ? "#d9a13c" : "rgba(217, 161, 60, 0.4)";
                strokeDasharray = "2 2";
              }

              // Calcular punto medio para la etiqueta
              const midX = (posOrigen.x + posDestino.x) / 2;
              const midY = (posOrigen.y + posDestino.y) / 2;

              return (
                <g key={`enlace-${idx}`} className="transition-opacity duration-200" opacity={isDimmed ? 0.15 : 1}>
                  <line
                    x1={posOrigen.x}
                    y1={posOrigen.y}
                    x2={posDestino.x}
                    y2={posDestino.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                  />

                  {/* Etiqueta del enlace al seleccionar o si está resaltado */}
                  {isHighlighted && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-45"
                        y="-10"
                        width="90"
                        height="20"
                        rx="4"
                        fill="#131a17"
                        stroke={strokeColor}
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        dy="4"
                        fontSize="9"
                        fill="#eef4f0"
                        fontWeight="500"
                      >
                        {enlace.etiqueta.slice(0, 16)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 2. NODOS */}
            {nodosVisibles.map((nodo: GrafoNodo) => {
              const pos = nodePositions[nodo.id] || { x: width / 2, y: height / 2 };
              const isSelected = selectedNodeId === nodo.id;
              const isConnected = connectedNodes.has(nodo.id);
              const isDimmed = selectedNodeId !== null && !isConnected;

              const isSospechoso = nodo.tipo === "sospechoso";
              const isPersona = nodo.tipo === "persona";
              const isEvidencia = nodo.tipo === "evidencia";

              // Colores según sospecha o evidencia
              const nodeRadius = isSospechoso ? 24 : isPersona ? 20 : 18;
              let fillColor = "#18211d";
              let strokeColor = "#3a4c42";

              if (isSospechoso) {
                if (nodo.categoria === "muy_alto") {
                  strokeColor = "#f47272";
                  fillColor = isSelected ? "#3b1717" : "#241414";
                } else if (nodo.categoria === "alto") {
                  strokeColor = "#d9a13c";
                  fillColor = isSelected ? "#382912" : "#211a10";
                } else {
                  strokeColor = "#2dd4a7";
                  fillColor = isSelected ? "#113329" : "#131f1a";
                }
              } else if (isEvidencia) {
                strokeColor = "#5db6ee";
                fillColor = isSelected ? "#142838" : "#111f29";
              }

              return (
                <g
                  key={`nodo-${nodo.id}`}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer transition-transform duration-150 hover:scale-110"
                  opacity={isDimmed ? 0.25 : 1}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingNode(nodo.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(isSelected ? null : nodo.id);
                  }}
                >
                  {/* Halo luminoso al seleccionar o conectar */}
                  {(isSelected || isConnected) && (
                    <circle
                      r={nodeRadius + 6}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2"
                      strokeDasharray={isSelected ? "none" : "3 3"}
                      opacity={isSelected ? 0.9 : 0.6}
                      filter="url(#glow)"
                    />
                  )}

                  {/* Círculo Principal del Nodo */}
                  <circle
                    r={nodeRadius}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3 : 2}
                  />

                  {/* Icono o letra central dentro del nodo */}
                  {isSospechoso ? (
                    <text
                      textAnchor="middle"
                      dy="4"
                      fontSize="12"
                      fill={strokeColor}
                      fontWeight="bold"
                    >
                      S
                    </text>
                  ) : isPersona ? (
                    <text
                      textAnchor="middle"
                      dy="4"
                      fontSize="11"
                      fill="#80938a"
                      fontWeight="bold"
                    >
                      P
                    </text>
                  ) : (
                    <text
                      textAnchor="middle"
                      dy="4"
                      fontSize="11"
                      fill="#5db6ee"
                      fontWeight="bold"
                    >
                      E
                    </text>
                  )}

                  {/* Etiqueta de Texto debajo del nodo */}
                  <text
                    textAnchor="middle"
                    dy={nodeRadius + 14}
                    fontSize="11"
                    fontWeight={isSelected ? "600" : "500"}
                    fill={isSelected ? "#ffffff" : "#a9bab0"}
                    className="pointer-events-none drop-shadow"
                  >
                    {nodo.label.length > 18
                      ? nodo.label.slice(0, 16) + "…"
                      : nodo.label}
                  </text>

                  {/* Badge de puntaje para sospechosos */}
                  {isSospechoso && nodo.puntaje !== undefined && (
                    <g transform={`translate(${nodeRadius - 4}, ${-nodeRadius + 4})`}>
                      <circle r="9" fill={strokeColor} />
                      <text
                        textAnchor="middle"
                        dy="3.5"
                        fontSize="9"
                        fill="#0a0f0d"
                        fontWeight="bold"
                      >
                        {nodo.puntaje}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Leyenda en la esquina inferior izquierda */}
        <div className="absolute bottom-3 left-3 rounded-lg border border-border/80 bg-surface/90 p-2.5 text-xs backdrop-blur-md">
          <div className="mb-1.5 font-semibold text-text">Leyenda</div>
          <div className="flex flex-col gap-1 text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-danger bg-danger/20" />
              Sospechoso (Muy alto / Alto)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-accent bg-accent/20" />
              Sospechoso (Medio / Bajo)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-info bg-info/20" />
              Evidencia descubierta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-accent" />
              Vínculo Persona ↔ Evidencia
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 border-b border-dashed border-info" />
              Relación interpersonal
            </span>
          </div>
        </div>

        {/* Tarjeta de Inspección del Nodo Seleccionado */}
        {selectedNode && (
          <div className="absolute right-3 top-3 w-72 animate-fade-up rounded-md border border-border bg-surface/95 p-4 shadow-overlay backdrop-blur-md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-text-dim">
                  {selectedNode.tipo}
                </span>
                <h4 className="text-sm font-semibold text-text">
                  {selectedNode.label}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="text-text-dim hover:text-text text-xs"
              >
                X
              </button>
            </div>

            {selectedNode.tipo === "sospechoso" && (
              <div className="mt-2.5 space-y-1.5 text-xs text-text-muted">
                <div className="flex justify-between">
                  <span>Puntos de sospecha:</span>
                  <MonoText className="text-text font-bold">
                    {selectedNode.puntaje} pts
                  </MonoText>
                </div>
                <div className="flex justify-between items-center">
                  <span>Nivel:</span>
                  <Badge variant={selectedNode.categoria as "bajo" | "medio" | "alto" | "muy_alto"}>
                    {CATEGORIA_LABELS[selectedNode.categoria ?? "bajo"] ?? selectedNode.categoria}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <span className={selectedNode.interrogado ? "text-success" : "text-text-dim"}>
                    {selectedNode.interrogado ? "Interrogado" : "Sin interrogar"}
                  </span>
                </div>
              </div>
            )}

            {selectedNode.tipo === "evidencia" && (
              <div className="mt-2.5 space-y-1.5 text-xs text-text-muted">
                {selectedNode.descripcion && (
                  <p className="leading-relaxed text-text">
                    {selectedNode.descripcion}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-text-dim">
                  {selectedNode.lugar && <span>Lugar: {selectedNode.lugar}</span>}
                  {selectedNode.hora && <span>Hora: {selectedNode.hora}</span>}
                </div>
              </div>
            )}

            {/* Conexiones directas */}
            <div className="mt-3 border-t border-border pt-2">
              <span className="text-[11px] font-medium text-text-dim">
                Conexiones ({connectedNodes.size - 1}):
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {Array.from(connectedNodes)
                  .filter((id) => id !== selectedNode.id)
                  .map((id) => {
                    const conn = nodosVisibles.find((n) => n.id === id);
                    if (!conn) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedNodeId(id)}
                        className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] text-text-muted hover:border-accent hover:text-text"
                      >
                        {conn.label}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!fullscreen) return tarjeta;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Red de vínculos y evidencias en pantalla completa"
      className="fixed inset-0 z-[60] flex animate-fade-in flex-col bg-bg/85 p-3 backdrop-blur-sm sm:p-6"
      /* Solo cierra al pulsar el fondo, no al soltar un arrastre del grafo
         que termine fuera de la tarjeta. */
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setFullscreen(false);
      }}
    >
      {tarjeta}
    </div>,
    document.body,
  );
}
