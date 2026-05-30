"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Shield, KeyRound } from "lucide-react";

export default function PerfilPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function cargarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setNombre(user.user_metadata?.full_name ?? "");
      setEmail(user.email ?? "");
      setCargando(false);
    }
    cargarPerfil();
  }, [router, supabase]);

  async function handleGuardarNombre(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    setGuardando(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: nombre.trim() },
    });
    if (error) {
      toast.error("Error al actualizar el nombre");
    } else {
      toast.success("Nombre actualizado");
    }
    setGuardando(false);
  }

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordNueva.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setCambiandoPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: passwordNueva,
    });
    if (error) {
      toast.error(error.message || "Error al cambiar la contraseña");
    } else {
      toast.success("Contraseña actualizada");
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
    }
    setCambiandoPassword(false);
  }

  if (cargando) {
    return (
      <div className="p-6 max-w-xl space-y-6 animate-pulse">
        <div className="h-8 w-32 rounded-lg bg-muted" />
        <div className="rounded-xl border bg-card p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-10 w-full rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tu información personal
        </p>
      </div>

      {/* Información */}
      <form onSubmit={handleGuardarNombre} className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Información personal
        </h2>

        <div className="space-y-2">
          <label htmlFor="nombre" className="text-sm font-medium">
            Nombre completo
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">El correo no se puede modificar</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>2FA activo (TOTP)</span>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-sidebar-primary px-6 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar nombre"}
        </button>
      </form>

      {/* Cambiar contraseña */}
      <form onSubmit={handleCambiarPassword} className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Cambiar contraseña
        </h2>

        <div className="space-y-2">
          <label htmlFor="password-nueva" className="text-sm font-medium">
            Nueva contraseña
          </label>
          <input
            id="password-nueva"
            type="password"
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password-confirmar" className="text-sm font-medium">
            Confirmar contraseña
          </label>
          <input
            id="password-confirmar"
            type="password"
            value={passwordConfirmar}
            onChange={(e) => setPasswordConfirmar(e.target.value)}
            placeholder="Repite la contraseña"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
          />
        </div>

        <button
          type="submit"
          disabled={cambiandoPassword || !passwordNueva}
          className="rounded-lg bg-sidebar-primary px-6 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {cambiandoPassword ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}
