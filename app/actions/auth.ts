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
    // CORREGIDO: usar result.error.issues en lugar de result.error.errors
    const firstError = result.error.issues[0];
    return { error: firstError.message };
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
