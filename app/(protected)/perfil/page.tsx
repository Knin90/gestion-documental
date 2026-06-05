"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Shield, KeyRound, Eye, EyeOff } from "lucide-react";

export default function PerfilPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: perfil } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (perfil) {
        setNombre(perfil.full_name ?? "");
        setEmail(perfil.email ?? user.email ?? "");
        setRole(perfil.role ?? "user");
      }
      setCargando(false);
    }
    cargarDatos();
  }, []);

  async function handleGuardarNombre(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { toast.error("El nombre no puede estar vacío"); return; }
    setGuardando(true);
    const { error } = await supabase.from("profiles").update({ full_name: nombre.trim() }).eq("email", email);
    if (error) toast.error("Error al actualizar"); else toast.success("Nombre actualizado");
    setGuardando(false);
  }

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordNueva.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
    if (passwordNueva !== passwordConfirmar) { toast.error("No coinciden"); return; }
    setCambiandoPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordNueva });
    if (error) toast.error(error.message);
    else { toast.success("Contraseña actualizada"); setPasswordNueva(""); setPasswordConfirmar(""); }
    setCambiandoPassword(false);
  }

  if (cargando) {
    return (
      <div className="p-6 max-w-3xl space-y-6 animate-pulse">
        <div className="h-8 w-32 rounded-lg bg-muted" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-10 w-full rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          {role === "admin" ? "Administrador del sistema" : "Usuario del sistema"}
        </p>
      </div>

      {/* Información personal */}
      <form onSubmit={handleGuardarNombre} className="neu-card rounded-xl bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4" />Información personal</h2>
        <div className="space-y-2">
          <label htmlFor="nombre" className="text-sm font-medium">Nombre completo</label>
          <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Correo</label>
          <input type="email" value={email} disabled className="w-full rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" /><span>2FA activo (TOTP)</span>
        </div>
        <button type="submit" disabled={guardando}
          className="rounded-lg bg-sidebar-primary px-6 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 disabled:opacity-50">
          {guardando ? "Guardando..." : "Guardar nombre"}
        </button>
      </form>

      {/* Cambiar contraseña */}
      <form onSubmit={handleCambiarPassword} className="neu-card rounded-xl bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4" />Cambiar contraseña</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">Nueva contraseña</label>
          <div className="relative">
            <input type={verPassword ? "text" : "password"} value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary" />
            <button type="button" onClick={() => setVerPassword(!verPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Confirmar contraseña</label>
          <div className="relative">
            <input type={verConfirmar ? "text" : "password"} value={passwordConfirmar} onChange={(e) => setPasswordConfirmar(e.target.value)} placeholder="Repite la contraseña"
              className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary" />
            <button type="button" onClick={() => setVerConfirmar(!verConfirmar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {verConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={cambiandoPassword || !passwordNueva}
          className="rounded-lg bg-sidebar-primary px-6 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 disabled:opacity-50">
          {cambiandoPassword ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}
