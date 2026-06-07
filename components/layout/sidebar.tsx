"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  Search,
  Upload,
  Download,
  User,
  UserPlus,
  LogOut,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SidebarItem } from "@/components/layout/sidebar-item";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

const ITEMS_NAVEGACION: { href: string; label: string; icon: LucideIcon; adminOnly?: boolean }[] = [
  { href: "/dashboard", label: "Panel de control", icon: LayoutDashboard },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/documentos/nuevo", label: "Nuevo documento", icon: FilePlus },
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/importar", label: "Importar", icon: Upload },
  { href: "/exportar", label: "Exportar", icon: Download },
] as const;

interface SidebarContenidoProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

function SidebarContenido({ onNavigate, collapsed }: SidebarContenidoProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("role").eq("id", user.id).single().then(({ data }) => {
        setIsAdmin(data?.role === "admin");
      });
    });
  }, []);

  async function handleCerrarSesion() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground overflow-hidden">
      <div
        style={{ justifyContent: collapsed ? "center" : undefined }}
        className="flex h-16 items-center border-b border-sidebar-border px-4"
      >
        <Link
          href="/dashboard"
          prefetch={false}
          onClick={onNavigate}
          className="flex items-center gap-2.5 font-semibold overflow-hidden"
        >
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden shrink-0">
            <img src="/logo-v2.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          {!collapsed && <span className="text-sm truncate">Gestión Documental</span>}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ITEMS_NAVEGACION.filter(item => !item.adminOnly || isAdmin).map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4 space-y-1">
        <SidebarItem href="/perfil" label="Mi perfil" icon={User} onNavigate={onNavigate} collapsed={collapsed} />
        {isAdmin && (
          <SidebarItem href="/agregar-usuario" label="Agregar usuario" icon={UserPlus} onNavigate={onNavigate} collapsed={collapsed} />
        )}
        {!collapsed && <NotificationBell />}
        <button
          onClick={handleCerrarSesion}
          title={collapsed ? "Cerrar sesión" : undefined}
          style={{ justifyContent: collapsed ? "center" : undefined }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
        {!collapsed && (
          <div className="flex items-center justify-between px-3 pt-2">
            <span className="text-xs text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
        )}
      </div>
    </div>
  );
}

interface SidebarDesktopProps {
  collapsed?: boolean;
}

export function SidebarDesktop({ collapsed }: SidebarDesktopProps) {
  return (
    <aside
      style={{ width: collapsed ? "64px" : "256px" }}
      className="hidden shrink-0 border-r border-sidebar-border lg:flex transition-all duration-300"
    >
      <SidebarContenido collapsed={collapsed} />
    </aside>
  );
}

interface SidebarMobileProps {
  estaAbierto: boolean;
  onCerrar: () => void;
}

export function SidebarMobile({ estaAbierto, onCerrar }: SidebarMobileProps) {
  if (!estaAbierto) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onCerrar}
        aria-hidden="true"
      />
      <aside className="fixed inset-y-0 left-0 z-50 w-64 shadow-xl lg:hidden">
        <div className="relative h-full">
          <button
            onClick={onCerrar}
            className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
          <SidebarContenido onNavigate={onCerrar} />
        </div>
      </aside>
    </>
  );
}