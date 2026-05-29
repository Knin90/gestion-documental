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
    // Mensaje genérico por seguridad
    return { error: "Correo o contraseña incorrectos" };
  }

  // Obtener factores MFA del usuario
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasMfa = (factors?.totp?.length ?? 0) > 0;

  if (hasMfa) {
    const factorId = factors?.totp?.[0]?.id;
    redirect(`/verificar-2fa?factorId=${factorId}`);
  } else {
    redirect("/configurar-2fa");
  }
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
      return {
        error: "Este correo no tiene acceso. Pide a un usuario que te invite.",
      };
    }
    if (
      error.message.includes("already registered") ||
      error.message.includes("already been registered") ||
      error.message.includes("User already registered")
    ) {
      return {
        error: "Este correo ya tiene una cuenta. Inicia sesión directamente.",
      };
    }
    return { error: "No se pudo crear la cuenta. Verifica los datos." };
  }

  return { success: true };
}