"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, User, FileText, Download, Upload, Key, Trash2, Crown } from "lucide-react";

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ACCION_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  invitar_usuario:          { label: "Invitó usuario",         icon: <User className="h-3.5 w-3.5" />,     color: "bg-blue-100 text-blue-800" },
  eliminar_usuario:         { label: "Eliminó usuario",        icon: <Trash2 className="h-3.5 w-3.5" />,   color: "bg-red-100 text-red-800" },
  cambiar_permiso:          { label: "Cambió permiso",         icon: <Key className="h-3.5 w-3.5" />,      color: "bg-yellow-100 text-yellow-800" },
  cambiar_rol:              { label: "Cambió rol",             icon: <Shield className="h-3.5 w-3.5" />,   color: "bg-purple-100 text-purple-800" },
  transferir_propiedad:     { label: "Transfirió propiedad",   icon: <Crown className="h-3.5 w-3.5" />,    color: "bg-orange-100 text-orange-800" },
  habilitar_exportacion:    { label: "Habilitó exportación",   icon: <Download className="h-3.5 w-3.5" />, color: "bg-green-100 text-green-800" },
  deshabilitar_exportacion: { label: "Deshabilitó exportación",icon: <Download className="h-3.5 w-3.5" />, color: "bg-gray-100 text-gray-800" },
  importar_documentos:      { label: "Importó documentos",     icon: <Upload className="h-3.5 w-3.5" />,   color: "bg-cyan-100 text-cyan-800" },
  exportar_documentos:      { label: "Exportó documentos",     icon: <Download className="h-3.5 w-3.5" />, color: "bg-teal-100 text-teal-800" },
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function DetallesExtra({ action, details }: { action: string; details: Record<string, unknown> | null }) {
  if (!details) return null;
  if (action === "invitar_usuario") {
    return <span className="text-xs text-muted-foreground">→ {String(details.nombre)} ({String(details.role)}, {String(details.permission)})</span>;
  }
  if (action === "cambiar_permiso") {
    return <span className="text-xs text-muted-foreground">→ {String(details.permission)}</span>;
  }
  if (action === "cambiar_rol") {
    return <span className="text-xs text-muted-foreground">→ {String(details.role)}</span>;
  }
  if (action === "importar_documentos") {
    return <span className="text-xs text-muted-foreground">→ {String(details.cantidad)} docs {String(details.tipo)}</span>;
  }
  if (action === "exportar_documentos") {
    return <span className="text-xs text-muted-foreground">→ {String(details.cantidad)} docs {String(details.tipo)}</span>;
  }
  return null;
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroAccion, setFiltroAccion] = useState("todos");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200)
        .then(({ data }) => {
          setLogs(data ?? []);
          setCargando(false);
        });
    });
  }, []);

  const logsFiltrados = filtroAccion === "todos"
    ? logs
    : logs.filter(l => l.action === filtroAccion);

  if (cargando) {
    return (
      <div className="p-6 max-w-5xl space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="rounded-xl border bg-card p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Registro de auditoría
        </h1>
        <p className="text-sm text-muted-foreground">
          Historial de acciones realizadas en el sistema
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Filtrar por acción:</label>
        <select
          value={filtroAccion}
          onChange={(e) => setFiltroAccion(e.target.value)}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
        >
          <option value="todos">Todas las acciones</option>
          {Object.entries(ACCION_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">{logsFiltrados.length} registros</span>
      </div>

      <div className="rounded-xl border bg-card">
        {logsFiltrados.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No hay registros de auditoría aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acción</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Objetivo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logsFiltrados.map((log) => {
                  const config = ACCION_CONFIG[log.action];
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatFecha(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs">{log.user_email}</td>
                      <td className="px-4 py-3">
                        {config ? (
                          <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium " + config.color}>
                            {config.icon}
                            {config.label}
                          </span>
                        ) : (
                          <span className="text-xs">{log.action}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {log.entity_id ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <DetallesExtra action={log.action} details={log.details} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
