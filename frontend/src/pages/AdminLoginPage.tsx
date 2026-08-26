import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import AuraBackground from "@/organisms/AuraBackground.tsx";
import { Card, Button, Input, Spinner, MorphIcon } from "@/atoms";
import { BrandLogo } from "@/molecules";
import { ICON } from "@/lib/icons.ts";
import { adminApi } from "@/api/adminClient.ts";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verPass, setVerPass] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminApi.login(user, pass);
      navigate("/admin");
    } catch {
      setError("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuraBackground>
      <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
        <Card tone="raised" className="w-full max-w-sm p-7">
          <div className="mb-7 flex flex-col items-center gap-4 text-center">
            <BrandLogo size="md" showTagline={false} />
            <div>
              <h1 className="flex items-center justify-center gap-2 font-display text-lg font-semibold text-text">
                <Lock className="h-4 w-4 text-accent" strokeWidth={1.75} />
                Administración
              </h1>
              <p className="mt-1 text-sm text-text-muted">
                Ingresa tus Credenciales para Gestionar los casos
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Usuario"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
            <Input
              label="Contraseña"
              type={verPass ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              autoComplete="current-password"
              error={error || undefined}
              trailing={
                <button
                  type="button"
                  onClick={() => setVerPass((v) => !v)}
                  aria-label={
                    verPass ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-pressed={verPass}
                  className="rounded-sm p-1.5 text-text-dim transition-colors hover:text-text"
                >
                  {/* El ojo se tacha dibujando la barra, no cambiando de icono */}
                  <MorphIcon
                    icon={verPass ? ICON.eyeOff : ICON.eye}
                    size={16}
                  />
                </button>
              }
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              block
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : "Ingresar"}
            </Button>
          </form>
        </Card>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la aplicación
        </Link>
      </div>
    </AuraBackground>
  );
}
