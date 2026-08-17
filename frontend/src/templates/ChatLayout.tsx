import { useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import AppSidebar from "@/organisms/AppSidebar.tsx";
import TopBar from "@/organisms/TopBar.tsx";
import type { Sesion } from "@/api/types.ts";

interface ChatLayoutProps {
  children: ReactNode;
  sesiones: Sesion[];
  titulos?: Record<string, string>;
  sidebarLoading?: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  rightPanel?: ReactNode;
  rightPanelLabel?: string;
}

/**
 * Tres zonas: historial (izquierda), trabajo (centro) y panel de apoyo
 * (derecha). El panel derecho pasa de 320px a 400px y por debajo de `xl` se
 * convierte en un cajon, en lugar de desaparecer sin sustituto como antes.
 */
export default function ChatLayout({
  children,
  sesiones,
  titulos,
  sidebarLoading,
  title,
  subtitle,
  badges,
  actions,
  rightPanel,
  rightPanelLabel = "Expediente",
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /* En pantallas grandes el sidebar no es un cajon: se repliega en su lugar,
     dejando todo el ancho al area de trabajo. */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      <AppSidebar
        sesiones={sesiones}
        titulos={titulos}
        loading={sidebarLoading}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          subtitle={subtitle}
          badges={badges}
          actions={actions}
          onOpenSidebar={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
          onOpenPanel={rightPanel ? () => setPanelOpen(true) : undefined}
          panelLabel={rightPanelLabel}
        />

        <div className="flex min-h-0 flex-1">
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </main>

          {rightPanel && (
            <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-bg-soft/80 backdrop-blur-xl lg:flex xl:w-[25rem]">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>

      {/* Cajon del panel de apoyo para pantallas menores a xl */}
      {rightPanel && panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
            onClick={() => setPanelOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex h-full w-[min(26rem,100vw)] flex-col border-l border-border bg-bg-soft shadow-2xl shadow-black/60">
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="Cerrar expediente"
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-text-dim transition-colors hover:bg-surface-hover hover:text-text"
            >
              <X className="h-5 w-5" />
            </button>
            {rightPanel}
          </div>
        </div>
      )}
    </div>
  );
}
