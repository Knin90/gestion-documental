"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Copy, Users, UserPlus, Trash2, Crown } from "lucide-react";
import { invitarUsuario, eliminarUsuario, cambiarPermisoUsuario, cambiarRolUsuario, transferirPropiedad } from "@/app/actions/invite";

interface UsuarioTabla {
  email: string;
  full_name: string;
  access_code: string | null;
  is_active: boolean;
  created_at: string;
  registrado: boolean;
  permission: string;
  role: string;
  is_owner: boolean;
}

export default function AgregarUsuarioPage() {
  const [myEmail, setMyEmail] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioTabla[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [nuevoPermiso, setNuevoPermiso] = useState<"editor" | "viewer">("editor");
  const [nuevoRol, setNuevoRol] = useState<"admin" | "user">("user");
  const [invitando, setInvitando] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [verCodigoGenerado, setVerCodigoGenerado] = useState(false);
  const [codigosVisibles, setCodigosVisibles] = useState<Record<string, boolean>>({});
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [cambiandoPermiso, setCambiandoPermiso] = useState<string | null>(null);
  const [cambiandoRol, setCambiandoRol] = useState<string | null>(null);
  const [transfiriendo, setTransfiriendo] = useState(false);
  const [cargando, setCargando] = useState(true);

  const supabase = createClient();

  async function cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: perfil } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!perfil) return;
    setMyEmail(perfil.email ?? user.email ?? "");
    setIsOwner(perfil.is_owner ?? false);

    const { data: permitidos } = await supabase
      .from("allowed_emails")
      .select("email, full_name, access_code, is_active, created_at, permission, role")
      .eq("org_id", perfil.org_id)
      .order("created_at", { ascending: true });

    const { data: registrados } = await supabase
      .from("profiles")
      .select("email, role, is_owner")
      .eq("org_id", perfil.org_id);

    const emailsMap = new Map(registrados?.map((p) => [p.email, { role: p.role, is_owner: p.is_owner }]) ?? []);

    setUsuarios((permitidos ?? []).map((u) => {
      const reg = emailsMap.get(u.email);
      return {
        email: u.email,
        full_name: u.full_name || "—",
        access_code: u.access_code,
        is_active: u.is_active,
        created_at: u.created_at,
        registrado: emailsMap.has(u.email),
        permission: u.permission || "editor",
        role: reg?.role || u.role || "user",
        is_owner: reg?.is_owner ?? false,
      };
    }));
    setCargando(false);
  }

  useEffect(() => { cargarDatos(); }, []);

  async function handleInvitar(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoCorreo.trim()) { toast.error("Nombre y correo son obligatorios"); return; }
    setInvitando(true);
    setCodigoGenerado("");
    const res = await invitarUsuario(nuevoNombre.trim(), nuevoCorreo.trim(), nuevoPermiso, nuevoRol);
    if (res.success && res.access_code) {
      setCodigoGenerado(res.access_code);
      toast.success("Usuario agregado");
      setNuevoNombre(""); setNuevoCorreo(""); setNuevoPermiso("editor"); setNuevoRol("user");
      await cargarDatos();
    } else { toast.error(res.error ?? "Error al agregar"); }
    setInvitando(false);
  }

  async function handleCambiarPermiso(emailUsuario: string, permiso: "editor" | "viewer") {
    setCambiandoPermiso(emailUsuario);
    const res = await cambiarPermisoUsuario(emailUsuario, permiso);
    if (res.success) { toast.success("Permiso actualizado"); await cargarDatos(); }
    else { toast.error(res.error ?? "Error"); }
    setCambiandoPermiso(null);
  }

  async function handleCambiarRol(emailUsuario: string, rol: "admin" | "user") {
    setCambiandoRol(emailUsuario);
    const res = await cambiarRolUsuario(emailUsuario, rol);
    if (res.success) { toast.success("Rol actualizado"); await cargarDatos(); }
    else { toast.error(res.error ?? "Error"); }
    setCambiandoRol(null);
  }

  async function handleTransferir(emailNuevo: string) {
    if (!confirm("¿Transferir la propiedad a " + emailNuevo + "? Perderás tu cargo de propietario.")) return;
    setTransfiriendo(true);
    const res = await transferirPropiedad(emailNuevo);
    if (res.success) { toast.success("Propiedad transferida"); await cargarDatos(); }
    else { toast.error(res.error ?? "Error"); }
    setTransfiriendo(false);
  }

  async function handleEliminar(emailEliminar: string) {
    setEliminando(emailEliminar);
    const res = await eliminarUsuario(emailEliminar);
    if (res.success) { toast.success("Usuario eliminado"); await cargarDatos(); }
    else { toast.error(res.error ?? "Error"); }
    setEliminando(null);
  }

  function copiarCodigo(codigo: string) { navigator.clipboard.writeText(codigo); toast.success("Código copiado"); }
  function toggleVerCodigo(e: string) { setCodigosVisibles((prev) => ({ ...prev, [e]: !prev[e] })); }

  if (cargando) {
    return (
      <div className="p-6 max-w-4xl space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="rounded-xl border bg-card p-6"><div className="h-10 w-full rounded-lg bg-muted" /></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agregar usuario</h1>
        <p className="text-sm text-muted-foreground">Gestiona los usuarios de tu organización</p>
      </div>

      <div className="neu-card rounded-xl bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2"><UserPlus className="h-4 w-4" />Nuevo usuario</h2>
        <form onSubmit={handleInvitar} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Nombre completo</label>
              <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Nombre y apellido"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Correo electrónico</label>
              <input type="email" value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} placeholder="correo@ejemplo.com"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Rol</label>
              <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value as "admin" | "user")}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary">
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Permiso</label>
              <select value={nuevoPermiso} onChange={(e) => setNuevoPermiso(e.target.value as "editor" | "viewer")}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary">
                <option value="editor">Editor — puede crear, editar y eliminar</option>
                <option value="viewer">Solo lectura — solo puede ver</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={invitando}
            className="flex items-center gap-2 rounded-lg bg-sidebar-primary px-5 py-2 text-sm font-medium text-sidebar-primary-foreground hover:opacity-90 disabled:opacity-50">
            <UserPlus className="h-4 w-4" />
            {invitando ? "Agregando..." : "Agregar y generar código"}
          </button>
        </form>
        {codigoGenerado && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
            <p className="text-sm font-medium text-green-800">Usuario agregado</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-green-700">Código:</span>
              <span className="font-mono text-sm font-bold tracking-widest text-green-900">{verCodigoGenerado ? codigoGenerado : "••••••••"}</span>
              <button onClick={() => setVerCodigoGenerado(!verCodigoGenerado)} className="text-green-700 hover:text-green-900">
                {verCodigoGenerado ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => copiarCodigo(codigoGenerado)} className="text-green-700 hover:text-green-900"><Copy className="h-3.5 w-3.5" /></button>
            </div>
            <p className="text-xs text-green-600">Comparte este código con el usuario para que pueda registrarse.</p>
          </div>
        )}
      </div>

      {usuarios.length > 0 && (
        <div className="neu-card rounded-xl bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4" />Usuarios ({usuarios.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nombre</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Correo</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Rol</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Permiso</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {usuarios.map((u) => (
                  <tr key={u.email}>
                    <td className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        {u.is_owner && <Crown className="h-3.5 w-3.5 text-yellow-500" />}
                        {u.full_name}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{u.email}</td>
                    <td className="px-3 py-2">
                      <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " + (u.registrado ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>
                        {u.registrado ? "Registrado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {u.is_owner ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Crown className="h-3 w-3" />Propietario
                        </span>
                      ) : u.email === myEmail ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">Admin</span>
                      ) : (
                        <select value={u.role} disabled={cambiandoRol === u.email || !u.registrado}
                          onChange={(e) => handleCambiarRol(u.email, e.target.value as "admin" | "user")}
                          className="rounded-lg border bg-background px-2 py-1 text-xs focus:outline-none disabled:opacity-50 cursor-pointer">
                          <option value="user">Usuario</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {u.email !== myEmail ? (
                        <select value={u.permission} disabled={cambiandoPermiso === u.email}
                          onChange={(e) => handleCambiarPermiso(u.email, e.target.value as "editor" | "viewer")}
                          className="rounded-lg border bg-background px-2 py-1 text-xs focus:outline-none disabled:opacity-50 cursor-pointer">
                          <option value="editor">Editor</option>
                          <option value="viewer">Solo lectura</option>
                        </select>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {isOwner && u.email !== myEmail && u.registrado && u.role === "admin" && (
                          <button onClick={() => handleTransferir(u.email)} disabled={transfiriendo}
                            className="rounded p-1 text-yellow-600 hover:bg-yellow-50 disabled:opacity-50" title="Transferir propiedad">
                            <Crown className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {u.email !== myEmail && !u.is_owner && (
                          <button onClick={() => handleEliminar(u.email)} disabled={eliminando === u.email}
                            className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50">
                            {eliminando === u.email ? "..." : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
