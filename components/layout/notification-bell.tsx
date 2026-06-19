"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { marcarTodasLeidas, marcarUnaLeida, limpiarLeidas } from "@/app/actions/notifications";

interface Notificacion {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

const ICONOS: Record<string, string> = {
  documento_nuevo: "📄",
  pdf_subido: "📎",
  usuario_nuevo: "👤",
};

function formatearFecha(fecha: string, ahora: number) {
  const diff = ahora - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  if (horas < 24) return `Hace ${horas}h`;
  return `Hace ${dias}d`;
}

export function NotificationBell() {
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const orgIdRef = useRef<string | null>(null);
  const supabase = createClient();

  const noLeidas = notificaciones.filter((n) => !n.read).length;

  // Congela "ahora" en el momento del memo, no en cada render — evita
  // llamar Date.now() durante el render (impuro).
  const notificacionesFormateadas = useMemo(() => {
    const ahora = Date.now();
    return notificaciones.map((n) => ({
      ...n,
      fechaFormateada: formatearFecha(n.created_at, ahora),
    }));
  }, [notificaciones]);

  async function cargar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) return;
    orgIdRef.current = profile.org_id;

    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at")
      .eq("org_id", profile.org_id)
      .order("created_at", { ascending: false })
      .limit(20);

    setNotificaciones(data ?? []);
    setCargando(false);
  }

  // Realtime — escucha nuevas notificaciones de la propia organización
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    cargar().then(() => {
      if (!orgIdRef.current) return;
      channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `org_id=eq.${orgIdRef.current}`,
          },
          () => cargar()
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  async function handleLimpiarLeidas() {
    const previo = notificaciones;
    setNotificaciones((prev) => prev.filter((n) => !n.read));
    const res = await limpiarLeidas();
    if (!res.success) {
      setNotificaciones(previo);
      console.error("No se pudo limpiar notificaciones leídas:", res.error);
    }
  }

  async function handleMarcarTodas() {
    const previo = notificaciones;
    setNotificaciones((prev) => prev.map((n) => ({ ...n, read: true })));
    const res = await marcarTodasLeidas();
    if (!res.success) {
      setNotificaciones(previo);
      console.error("No se pudieron marcar todas como leídas:", res.error);
      return;
    }
    setAbierto(false);
  }

  async function handleMarcarUna(id: string) {
    const previo = notificaciones;
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const res = await marcarUnaLeida(id);
    if (!res.success) {
      setNotificaciones(previo);
      console.error("No se pudo marcar como leída:", res.error);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="relative flex items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className="fixed bottom-16 left-16 z-50 w-80 rounded-xl border bg-card shadow-lg"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-semibold">Notificaciones</span>
            <div className="flex items-center gap-3">
            {noLeidas > 0 && (
              <button
                onClick={handleMarcarTodas}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Marcar leídas
              </button>
            )}
            {notificaciones.some((n) => n.read) && (
              <button
                onClick={handleLimpiarLeidas}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Limpiar leídas
              </button>
            )}
          </div>
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {cargando ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notificacionesFormateadas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Sin notificaciones</p>
              </div>
            ) : (
              notificacionesFormateadas.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read && handleMarcarUna(n.id)}
                  className={`w-full text-left flex gap-3 px-4 py-3 border-b transition-colors hover:bg-muted/40 ${
                    !n.read ? "bg-muted/20" : ""
                  }`}
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="text-lg shrink-0 mt-0.5">
                    {ICONOS[n.type] ?? "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!n.read ? "font-semibold" : "font-medium"}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {n.body}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {n.fechaFormateada}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
