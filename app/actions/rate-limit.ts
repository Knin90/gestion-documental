"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface RateLimitConfig {
  key: string;        // identificador único (ej: "invitar:user@email.com")
  maxAttempts: number; // máximo de intentos permitidos
  windowMinutes: number; // ventana de tiempo en minutos
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // minutos hasta que se resetea
}

export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const admin = getAdminClient();
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000).toISOString();

  try {
    // Limpiar entradas viejas
    await admin.from("rate_limits").delete().lt("window_start", windowStart);

    // Buscar intentos en la ventana actual
    const { data } = await admin
      .from("rate_limits")
      .select("id, attempts, window_start")
      .eq("key", config.key)
      .gte("window_start", windowStart)
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      // Primera vez — crear registro
      await admin.from("rate_limits").insert({ key: config.key, attempts: 1 });
      return { allowed: true, remaining: config.maxAttempts - 1, resetIn: config.windowMinutes };
    }

    if (data.attempts >= config.maxAttempts) {
      const resetAt = new Date(data.window_start).getTime() + config.windowMinutes * 60 * 1000;
      const resetIn = Math.ceil((resetAt - Date.now()) / 60000);
      return { allowed: false, remaining: 0, resetIn: Math.max(1, resetIn) };
    }

    // Incrementar intentos
    await admin.from("rate_limits").update({ attempts: data.attempts + 1 }).eq("id", data.id);
    return { allowed: true, remaining: config.maxAttempts - data.attempts - 1, resetIn: config.windowMinutes };

  } catch (err) {
    console.error("Rate limit error:", err);
    // Si falla el rate limit, permitir la operación para no bloquear usuarios legítimos
    return { allowed: true, remaining: 0, resetIn: 0 };
  }
}
