"use client";

import { useState } from "react";
import { SidebarDesktop, SidebarMobile } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface LayoutProtegidoProps {
  children: React.ReactNode;
}

export default function LayoutProtegido({ children }: LayoutProtegidoProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarDesktop />
      <SidebarMobile
        estaAbierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onAbrirMenu={() => setMenuAbierto(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
