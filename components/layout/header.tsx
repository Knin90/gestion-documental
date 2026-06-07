"use client";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface HeaderProps {
  onAbrirMenu: () => void;
  onToggleSidebar?: () => void;
  sidebarVisible?: boolean;
}

export function Header({ onAbrirMenu, onToggleSidebar, sidebarVisible = true }: HeaderProps) {
  return (
    <header className="flex h-14 items-center border-b bg-background px-4">
      {/* Botón toggle sidebar — solo desktop */}
      <button
        onClick={onToggleSidebar}
        aria-label={sidebarVisible ? "Ocultar sidebar" : "Mostrar sidebar"}
        className="mr-3 hidden rounded-lg p-1.5 hover:bg-muted transition-colors lg:flex"
      >
        {sidebarVisible
          ? <PanelLeftClose className="h-5 w-5" />
          : <PanelLeftOpen className="h-5 w-5" />
        }
      </button>

      {/* Botón hamburguesa — solo mobile */}
      <button
        onClick={onAbrirMenu}
        aria-label="Abrir menú"
        className="mr-3 rounded-lg p-1.5 hover:bg-muted transition-colors lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <span className="text-sm font-semibold">Gestión Documental</span>
    </header>
  );
}