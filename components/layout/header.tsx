"use client";

import { Menu } from "lucide-react";

interface HeaderProps {
  onAbrirMenu: () => void;
}

export function Header({ onAbrirMenu }: HeaderProps) {
  return (
    <header className="flex h-14 items-center border-b bg-background px-4 lg:hidden">
      <button
        onClick={onAbrirMenu}
        aria-label="Abrir menú"
        className="mr-3 rounded-lg p-1.5 hover:bg-muted transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="text-sm font-semibold">Gestión Documental</span>
    </header>
  );
}
