import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, FileCode2 } from "lucide-react";
import AuraBackground from "@/organisms/AuraBackground.tsx";
import { Button, Spinner } from "@/atoms";
import { adminApi } from "@/api/adminClient.ts";

export default function AdminEditorPage() {
  const { archivo } = useParams<{ archivo: string }>();
  const navigate = useNavigate();
  const [contenido, setContenido] = useState("");
  const [original, setOriginal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!adminApi.isLoggedIn()) {
      navigate("/admin/login");
      return;
    }
    if (!archivo) return;
    adminApi
      .leerFuente(archivo)
      .then((r) => {
        setContenido(r.contenido);
        setOriginal(r.contenido);
        setLoading(false);
      })
      .catch(() => navigate("/admin"));
  }, [archivo]);

  async function handleGuardar() {
    if (!archivo) return;
    setSaving(true);
    setError("");
    try {
      await adminApi.guardarFuente(archivo, contenido);
      navigate("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar el archivo");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AuraBackground>
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner size="lg" label="Abriendo archivo" />
        </div>
      </AuraBackground>
    );
  }

  const modificado = contenido !== original;
  const lineas = contenido.split("\n").length;

  return (
    <AuraBackground>
      <div className="flex h-dvh flex-col">
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-glass px-5 py-3.5 backdrop-blur-xl">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>

          <div className="mx-2 hidden h-5 w-px bg-border sm:block" />

          <div className="flex min-w-0 items-center gap-2">
            <FileCode2 className="h-4 w-4 shrink-0 text-accent" />
            <h1 className="truncate font-mono text-sm text-text">{archivo}</h1>
            {modificado && (
              <span className="shrink-0 rounded-full bg-warning/12 px-2 py-0.5 text-xs font-semibold text-warning-soft">
                Sin guardar
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden font-mono text-xs text-text-dim sm:inline">
              {lineas} líneas
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGuardar}
              disabled={saving || !modificado}
            >
              {saving ? (
                <Spinner size="sm" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </Button>
          </div>
        </header>

        {/* El editor ocupa el alto disponible en vez de una altura fija */}
        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
          {error && (
            <div className="mb-3 flex items-center justify-between rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs text-danger-soft">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-text-dim hover:text-text"
              >
                X
              </button>
            </div>
          )}
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            spellCheck={false}
            aria-label={`Contenido de ${archivo}`}
            className="h-full w-full flex-1 resize-none rounded-xl border border-border bg-surface p-4 font-mono text-sm leading-relaxed text-text transition-colors hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 focus-visible:outline-none"
          />
        </div>
      </div>
    </AuraBackground>
  );
}
