import { useState } from "react";
import { SidebarDesktop, SidebarMobile } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface LayoutProtegidoProps {
  children: React.ReactNode;
}

export default function ProtectedLayoutClient({ children }: LayoutProtegidoProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarDesktop collapsed={collapsed} />
      <SidebarMobile
        estaAbierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onAbrirMenu={() => setMenuAbierto(true)}
          onToggleSidebar={() => setCollapsed(v => !v)}
          sidebarVisible={!collapsed}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
