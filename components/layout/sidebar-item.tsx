"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function SidebarItem({ href, label, icon: Icon, onNavigate, collapsed }: SidebarItemProps) {
  const pathname = usePathname();
  const estaActivo = pathname === href;

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      style={{ justifyContent: collapsed ? "center" : undefined }}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 overflow-hidden",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        estaActivo
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}