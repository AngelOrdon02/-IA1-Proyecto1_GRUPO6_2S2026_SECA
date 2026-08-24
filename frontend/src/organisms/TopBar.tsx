import type { ReactNode } from "react";
import { MorphIcon } from "@/atoms";
import { ICON } from "@/lib/icons.ts";

interface TopBarProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  onOpenSidebar: () => void;
  /** Cajon lateral abierto (movil): el icono del boton se pliega en una X. */
  sidebarOpen?: boolean;
  /** Colapso del sidebar en desktop (el cajon movil usa onOpenSidebar). */
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenPanel?: () => void;
  panelLabel?: string;
}

/**
 * Cabecera fija del area de trabajo. Antes no existia: el titulo del caso solo
 * aparecia dentro de una burbuja del chat y se perdia al hacer scroll.
 */
export default function TopBar({
  title,
  subtitle,
  badges,
  actions,
  onOpenSidebar,
  sidebarOpen = false,
  sidebarCollapsed = false,
  onToggleSidebar,
  onOpenPanel,
  panelLabel = "Expediente",
}: TopBarProps) {
  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center gap-3 bg-glass px-4 backdrop-blur-xl">
      {/* Hairline que se desvanece en los extremos */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border-strong/60 to-transparent"
      />
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Abrir menú"
        className="-ml-1 shrink-0 rounded-md p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text lg:hidden"
      >
        <MorphIcon icon={sidebarOpen ? ICON.x : ICON.menu} size={18} />
      </button>

      {/* Colapsar/expandir el sidebar: solo desktop */}
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
          aria-expanded={!sidebarCollapsed}
          className="-ml-1 hidden shrink-0 rounded-md p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text lg:inline-flex"
        >
          {/* El panel se pliega y despliega en el propio icono */}
          <MorphIcon
            icon={sidebarCollapsed ? ICON.panelLeft : ICON.panelLeftClose}
            size={18}
          />
        </button>
      )}

      <div className="min-w-0 flex-1">
        {title && (
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="truncate text-base font-semibold text-text">
              {title}
            </h1>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              {badges}
            </div>
          </div>
        )}
        {subtitle && (
          <p className="truncate text-xs text-text-dim">{subtitle}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {onOpenPanel && (
          <button
            type="button"
            onClick={onOpenPanel}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm text-text-muted transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-text lg:hidden"
          >
            <MorphIcon icon={ICON.panelRightOpen} size={15} />
            <span className="hidden sm:inline">{panelLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
}
