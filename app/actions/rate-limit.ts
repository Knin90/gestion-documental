"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface RateLimitConfig {
  key: string;           // Identificador único (ej: "invitar:user@email.com")
  maxAttempts: number;   // Máximo de intentos permitidos
  windowMinutes: number; // Ventana de tiempo en minutos
  isCritical?: boolean;  // Si es true, aplica Fail-Closed (bloquea si falla el rate limit)
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;       // Minutos hasta que se resetea
}

export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const admin = getAdminClient();
  const now = Date.now();
  const windowStart = new Date(now - config.windowMinutes * 60 * 1000).toISOString();
  const esCritico = config.isCritical ?? true; // Por defecto todo es crítico

  try {
    // 1. Limpieza asíncrona preventiva (no bloqueante para el hilo principal de lectura)
    (async () => {
      try {
        const { error: cleanupError } = await admin
          .from("rate_limits")
          .delete()
          .lt("window_start", windowStart);

        if (cleanupError) {
          console.error("Error en limpieza en segundo plano de rate limits:", cleanupError);
        }
      } catch (err) {
        console.error("Error en limpieza en segundo plano de rate limits (throw):", err);
      }
    })();

    // 2. Buscar intentos en la ventana actual u obtener una fila preexistente utilizando UPSERT nativo
    const { data, error: errorConsulta } = await admin
      .from("rate_limits")
      .select("id, attempts, window_start")
      .eq("key", config.key)
      .gte("window_start", windowStart)
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errorConsulta) throw errorConsulta;

    if (!data) {
      // SOLUCIÓN A RACE CONDITION: Usamos upsert pasándole el "key" para evitar colisiones duplicadas concurrentes
      const { data: nuevoRegistro, error: errorInsert } = await admin
        .from("rate_limits")
        .upsert(
          { key: config.key, attempts: 1, window_start: new Date().toISOString() },
          { onConflict: "key" } // Requiere un índice único UNIQUE(key) en tu DB
        )
        .select("window_start")
        .single();

      if (errorInsert) throw errorInsert;

      return { allowed: true, remaining: config.maxAttempts - 1, resetIn: config.windowMinutes };
    }

    // 3. Evaluar si superó el umbral
    if (data.attempts >= config.maxAttempts) {
      const resetAt = new Date(data.window_start).getTime() + config.windowMinutes * 60 * 1000;
      const resetIn = Math.ceil((resetAt - now) / 60000);
      return { allowed: false, remaining: 0, resetIn: Math.max(1, resetIn) };
    }

    // 4. Incrementar intentos de forma segura
    const { error: errorUpdate } = await admin
      .from("rate_limits")
      .update({ attempts: data.attempts + 1 })
      .eq("id", data.id);

    if (errorUpdate) throw errorUpdate;

    return { 
      allowed: true, 
      remaining: config.maxAttempts - data.attempts - 1, 
      resetIn: config.windowMinutes 
    };

  } catch (err) {
    console.error("FALLO CRÍTICO EN RATE LIMIT para la clave:", config.key, err);

    // 🔒 PRINCIPIO DE SEGURIDAD: FAIL-CLOSED
    if (esCritico) {
      return { 
        allowed: false, // Bloqueamos la petición por seguridad de la infraestructura
        remaining: 0, 
        resetIn: config.windowMinutes // Sugerimos esperar el tamaño de la ventana completa
      };
    }

    // Fail-Open controlado solo si explícitamente se configuró como no crítico
    return { allowed: true, remaining: 0, resetIn: 0 };
  }
}