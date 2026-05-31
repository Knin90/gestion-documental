"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export async function login(formData: FormData) {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: "Correo o contraseña incorrectos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { error: "Correo o contraseña incorrectos" };
  }

  // Verificar nivel de autenticación actual
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const currentLevel = aalData?.currentLevel;
  const nextLevel = aalData?.nextLevel;

  // Si ya está en aal2, no necesita verificar 2FA
  if (currentLevel === "aal2") {
    redirect("/dashboard");
  }

  // Si necesita subir a aal2 (tiene MFA configurado)
  if (nextLevel === "aal2") {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factorId = factors?.totp?.[0]?.id;
    redirect(`/verificar-2fa?factorId=${factorId}`);
  }

  // No tiene MFA configurado — mandarlo a configurar
  redirect("/configurar-2fa");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const registroSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(12, "La contraseña debe tener al menos 12 caracteres"),
  full_name: z.string().min(1, "El nombre es obligatorio").max(200),
});

export async function registro(formData: FormData) {
  const result = registroSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: { full_name: result.data.full_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes("no está autorizado")) {
      return { error: "Este correo no tiene acceso. Pide a un usuario que te invite." };
    }
    if (error.message.includes("already registered") || error.message.includes("User already registered")) {
      return { error: "Este correo ya tiene una cuenta. Inicia sesión directamente." };
    }
    return { error: "No se pudo crear la cuenta. Verifica los datos." };
  }

  return { success: true };
}

export async function verificarCodigoAcceso(codigo: string): Promise<{ valido: boolean; error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("access_code", codigo.trim().toUpperCase())
    .maybeSingle();

  if (!data) {
    return { valido: false, error: "Código de acceso inválido" };
  }
  return { valido: true };
}
