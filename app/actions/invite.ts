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

export async function invitarUsuario(
  nombre: string,
  correo: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  // Verificar que es admin
  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") {
    return { success: false, error: "No tienes permisos" };
  }

  const admin = getAdminClient();
  const emailLimpio = correo.trim().toLowerCase();
  const nombreLimpio = nombre.trim();

  if (!emailLimpio || !nombreLimpio) {
    return { success: false, error: "Nombre y correo son obligatorios" };
  }

  // Verificar que no existe ya
  const { data: existe } = await admin
    .from("allowed_emails")
    .select("id")
    .eq("email", emailLimpio)
    .maybeSingle();

  if (existe) {
    return { success: false, error: "Este correo ya está registrado" };
  }

  // Generar código único
  const { data: codigo, error: errorCodigo } = await admin.rpc("generate_access_code");
  if (errorCodigo || !codigo) {
    return { success: false, error: "Error al generar código" };
  }

  // Insertar en allowed_emails
  const { error: errorEmail } = await admin
    .from("allowed_emails")
    .insert({
      email: emailLimpio,
      invited_by: user.id,
      notes: nombreLimpio,
      is_active: true,
    });

  if (errorEmail) {
    console.error("Error al insertar en allowed_emails:", errorEmail.message);
    return { success: false, error: "Error al agregar correo autorizado" };
  }

  // Insertar en profiles (pre-crear perfil)
  const { error: errorPerfil } = await admin
    .from("profiles")
    .insert({
      id: crypto.randomUUID(),
      email: emailLimpio,
      full_name: nombreLimpio,
      access_code: codigo,
      role: "user",
    });

  if (errorPerfil) {
    console.error("Error al crear perfil:", errorPerfil.message);
    // No fallar — el perfil se creará al registrarse
  }

  revalidatePath("/perfil");
  return { success: true, access_code: codigo };
}

export async function eliminarUsuario(email: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") {
    return { success: false, error: "No tienes permisos" };
  }

  // No permitir eliminarse a sí mismo
  if (email === user.email) {
    return { success: false, error: "No puedes eliminarte a ti mismo" };
  }

  const admin = getAdminClient();

  await admin.from("allowed_emails").delete().eq("email", email);
  await admin.from("profiles").delete().eq("email", email);

  revalidatePath("/perfil");
  return { success: true };
}
