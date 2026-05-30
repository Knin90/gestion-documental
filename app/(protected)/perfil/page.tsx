"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Shield, KeyRound, Eye, EyeOff, Copy, Users, UserPlus, Trash2 } from "lucide-react";
import { invitarUsuario, eliminarUsuario } from "@/app/actions/invite";

interface Perfil {
  id: string;
  full_name: string;
  email: string;
  role: string;
  access_code: string | null;
  created_at: string;
}

export default function PerfilPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Invitar
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [invitando, setInvitando] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [verCodigoGenerado, setVerCodigoGenerado] = useState(false);

  // Contraseña
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  // Eliminar usuario
  const [eliminando, setEliminando] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();
  const esAdmin = role === "admin";

  async function cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: perfil } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (perfil) {
      setNombre(perfil.full_name ?? "");
      setEmail(perfil.email ?? user.email ?? "");
      setRole(perfil.role ?? "user");
      setAccessCode(perfil.access_code ?? "");
    }

    if (perfil?.role === "admin") {
      const { data: todos } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, access_code, created_at")
        .order("created_at", { ascending: true });
      setUsuarios(todos ?? []);
    }

    setCargando(false);
  }

  useEffect(() => { cargarDatos(); }, []);

  async function handleGuardarNombre(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { toast.error("El nombre no puede estar vacío"); return; }
    setGuardando(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: nombre.trim() })
      .eq("email", email);
    if (error) toast.error("Error al actualizar");
    else toast.success("Nombre actualizado");
    setGuardando(false);
  }

  async function handleInvitar(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoCorreo.trim()) {
      toast.error("Nombre y correo son obligatorios");
      return;
    }
    setInvitando(true);
    setCodigoGenerado("");

    const res = await invitarUsuario(nuevoNombre.trim(), nuevoCorreo.trim());

    if (res.success && res.access_code) {
      setCodigoGenerado(res.access_code);
      toast.success("Usuario agregado correctamente");
      setNuevoNombre("");
      setNuevoCorreo("");
      await cargarDatos();
    } else {
      toast.error(res.error ?? "Error al invitar");
    }
    setInvitando(false);
  }

  async function handleEliminar(emailEliminar: string) {
    setEliminando(emailEliminar);
    const res = await eliminarUsuario(emailEliminar);
    if (res.success) {
      toast.success("Usuario eliminado");
      await cargarDatos();
    } else {
      toast.error(res.error ?? "Error al eliminar");
    }
    setEliminando(null);
  }

  function copiarCodigo(codigo: string) {
    navigator.clipboard.writeText(codigo);
    toast.success("Código copiado");
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
        {Array.from({ length: 3 }).map((_, i) => (
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
          {esAdmin ? "Administrador del sistema" : "Usuario del sistema"}
        </p>
      </div>

      {/* Información personal */}
      <form onSubmit={handleGuardarNombre} className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Información personal
        </h2>
        <div className="space-y-2">
          <label htmlFor="nombre" className="text-sm font-medium">Nombre completo</label>
          <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Correo</label>
          <input type="email" value={email} disabled className="w-full rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" /><span>2FA activo (TOTP)</span>
        </div>
        <button type="submit" disabled={guardando} className="rounded-lg bg-sidebar-primary px-6 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 disabled:opacity-50">
          {guardando ? "Guardando..." : "Guardar nombre"}
        </button>
      </form>

      {/* Agregar usuario — solo admin */}
      {esAdmin && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Agregar usuario
          </h2>
          <p className="text-xs text-muted-foreground">
            Agrega un nuevo usuario autorizado. Se generará un código de acceso único.
          </p>
          <form onSubmit={handleInvitar} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="nuevo-nombre" className="text-xs font-medium">Nombre completo</label>
                <input id="nuevo-nombre" type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Nombre y apellido" className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary" />
              </div>
              <div className="space-y-1">
                <label htmlFor="nuevo-correo" className="text-xs font-medium">Correo electrónico</label>
                <input id="nuevo-correo" type="email" value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} placeholder="correo@ejemplo.com" className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary" />
              </div>
            </div>
            <button type="submit" disabled={invitando} className="flex items-center gap-2 rounded-lg bg-sidebar-primary px-5 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 disabled:opacity-50">
              <UserPlus className="h-4 w-4" />
              {invitando ? "Agregando..." : "Agregar y generar código"}
            </button>
          </form>

          {codigoGenerado && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
              <p className="text-sm font-medium text-green-800">Usuario agregado correctamente</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-green-700">Código de acceso:</span>
                <span className="font-mono text-sm font-bold tracking-widest text-green-900">
                  {verCodigoGenerado ? codigoGenerado : "••••••••"}
                </span>
                <button onClick={() => setVerCodigoGenerado(!verCodigoGenerado)} className="text-green-700 hover:text-green-900">
                  {verCodigoGenerado ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => copiarCodigo(codigoGenerado)} className="text-green-700 hover:text-green-900">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-green-600">Comparte este código con el usuario. Lo necesitará para ingresar al sistema.</p>
            </div>
          )}
        </div>
      )}

      {/* Tabla de usuarios — solo admin */}
      {esAdmin && usuarios.length > 0 && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios registrados ({usuarios.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nombre</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Correo</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Rol</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Registro</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td className="px-3 py-2">{u.full_name || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{u.email}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {u.role === "admin" ? "Admin" : "Usuario"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString("es")}
                    </td>
                    <td className="px-3 py-2">
                      {u.email !== email && (
                        <button
                          onClick={() => handleEliminar(u.email)}
                          disabled={eliminando === u.email}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {eliminando === u.email ? "..." : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cambiar contraseña */}
      <form onSubmit={handleCambiarPassword} className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Cambiar contraseña
        </h2>
        <div className="space-y-2">
          <label htmlFor="password-nueva" className="text-sm font-medium">Nueva contraseña</label>
          <div className="relative">
            <input id="password-nueva" type={verPassword ? "text" : "password"} value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary" />
            <button type="button" onClick={() => setVerPassword(!verPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="password-confirmar" className="text-sm font-medium">Confirmar contraseña</label>
          <div className="relative">
            <input id="password-confirmar" type={verConfirmar ? "text" : "password"} value={passwordConfirmar} onChange={(e) => setPasswordConfirmar(e.target.value)} placeholder="Repite la contraseña" className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary" />
            <button type="button" onClick={() => setVerConfirmar(!verConfirmar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {verConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={cambiandoPassword || !passwordNueva} className="rounded-lg bg-sidebar-primary px-6 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 disabled:opacity-50">
          {cambiandoPassword ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}
