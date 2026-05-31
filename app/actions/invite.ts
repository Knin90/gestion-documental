"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  error?: string;
  access_code?: string;
};

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verificarAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") return null;
  if (!perfil?.org_id) return null;

  return { user, orgId: perfil.org_id as string };
}

export async function invitarUsuario(nombre: string, correo: string): Promise<ActionResult> {
  const resultado = await verificarAdmin();
  if (!resultado) return { success: false, error: "No tienes permisos" };

  const { user, orgId } = resultado;
  const admin = getAdminClient();
  const emailLimpio = correo.trim().toLowerCase();
  const nombreLimpio = nombre.trim();

  if (!emailLimpio || !nombreLimpio) {
    return { success: false, error: "Nombre y correo son obligatorios" };
  }

  const { data: existe } = await admin
    .from("allowed_emails")
    .select("id")
    .eq("email", emailLimpio)
    .maybeSingle();

  if (existe) return { success: false, error: "Este correo ya está registrado" };

  const { data: codigo, error: errorCodigo } = await admin.rpc("generate_access_code");
  if (errorCodigo || !codigo) return { success: false, error: "Error al generar código" };

  const { error } = await admin
    .from("allowed_emails")
    .insert({
      email: emailLimpio,
      full_name: nombreLimpio,
      notes: nombreLimpio,
      access_code: codigo,
      invited_by: user.id,
      is_active: true,
      org_id: orgId,            // ← vincula el código a la org del admin
    });

  if (error) {
    console.error("Error:", error.message);
    return { success: false, error: "Error al agregar usuario" };
  }

  revalidatePath("/perfil");
  return { success: true, access_code: codigo };
}

export async function eliminarUsuario(email: string): Promise<ActionResult> {
  const resultado = await verificarAdmin();
  if (!resultado) return { success: false, error: "No tienes permisos" };

  const { user } = resultado;
  if (email === user.email) return { success: false, error: "No puedes eliminarte a ti mismo" };

  const admin = getAdminClient();

  const { data: authUsers } = await admin.auth.admin.listUsers();
  const authUser = authUsers?.users?.find((u) => u.email === email);

  if (authUser) {
    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(authUser.id);
    if (deleteAuthError) {
      console.error("Error eliminando de auth:", deleteAuthError.message);
      return { success: false, error: "Error al eliminar usuario" };
    }
  }

  await admin.from("allowed_emails").delete().eq("email", email);
  await admin.from("profiles").delete().eq("email", email);

  revalidatePath("/perfil");
  return { success: true };
}
