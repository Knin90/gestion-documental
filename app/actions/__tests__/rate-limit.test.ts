import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { checkRateLimit } from "../rate-limit";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});

// Generador de cadenas de Supabase ultra-flexible y compatible con promesas (Thenable)
const createFlexibleMockChain = (options: { maybeSingleValue?: any; upsertValue?: any; updateValue?: any } = {}) => {
  const spyMethods: Record<string, any> = {
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
  };

  const chain: any = new Proxy({}, {
    get(target, prop: string) {
      // Hacemos el chain "thenable": al hacer `await chain` (ej: .update().eq())
      // se resuelve con el resultado del update en vez de colgarse.
      if (prop === "then") {
        return (resolve: (value: any) => void) =>
          resolve(options.updateValue ?? { error: null });
      }

      // Resolvedores finales asíncronos específicos (devuelven una promesa real)
      if (prop === "maybeSingle") {
        return () => Promise.resolve(options.maybeSingleValue ?? { data: null, error: null });
      }
      if (prop === "single") {
        return () =>
          Promise.resolve(
            options.upsertValue ?? { data: { window_start: new Date().toISOString() }, error: null }
          );
      }

      // Métodos auditados: siguen la cadena devolviendo el propio chain
      if (prop in spyMethods) {
        return spyMethods[prop];
      }

      // Para cualquier otro método encadenable (.select, .lt, .gte, etc.) retornamos el proxy
      return () => chain;
    }
  });

  // Los métodos auditados deben continuar la cadena (.upsert().select(), .update().eq(), etc.)
  spyMethods.upsert.mockReturnValue(chain);
  spyMethods.update.mockReturnValue(chain);
  spyMethods.delete.mockReturnValue(chain);
  spyMethods.eq.mockReturnValue(chain);

  return { chain, spyMethods };
};

describe("checkRateLimit - Flujos de Éxito y Restricción", () => {
  it("permite el acceso si es la primera petición (crea registro con UPSERT)", async () => {
    const { chain, spyMethods } = createFlexibleMockChain({ maybeSingleValue: { data: null, error: null } });
    
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    });

    const res = await checkRateLimit({ key: "test-key", maxAttempts: 5, windowMinutes: 15 });
    
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(4);
    expect(spyMethods.upsert).toHaveBeenCalled();
  });

  it("bloquea el acceso si el contador de intentos supera el máximo permitido", async () => {
    const registroMock = { id: 1, attempts: 5, window_start: new Date(Date.now() - 5000).toISOString() };
    const { chain } = createFlexibleMockChain({ maybeSingleValue: { data: registroMock, error: null } });

    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    });

    const res = await checkRateLimit({ key: "test-key", maxAttempts: 5, windowMinutes: 15 });
    
    expect(res.allowed).toBe(false);
    expect(res.remaining).toBe(0);
    expect(res.resetIn).toBeGreaterThanOrEqual(1);
  });

  it("incrementa de forma secuencial el contador si quedan intentos disponibles", async () => {
    const registroMock = { id: 99, attempts: 2, window_start: new Date().toISOString() };
    const { chain, spyMethods } = createFlexibleMockChain({ 
      maybeSingleValue: { data: registroMock, error: null },
      updateValue: { error: null }
    });

    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    });

    const res = await checkRateLimit({ key: "test-key", maxAttempts: 5, windowMinutes: 15 });
    
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(2); 
    expect(spyMethods.update).toHaveBeenCalledWith({ attempts: 3 });
    expect(spyMethods.eq).toHaveBeenCalledWith("id", 99);
  });
});

describe("checkRateLimit - Tolerancia a Fallos (Fail-Closed / Fail-Open)", () => {
  it("aplica FAIL-CLOSED por defecto bloqueando el acceso si Supabase se cae", async () => {
    // Simulamos una caída total en la operación de lectura: maybeSingle rechaza.
    const brokenChain = new Proxy({}, {
      get(target, prop: string) {
        if (prop === "then") return undefined;
        if (prop === "maybeSingle") {
          return vi.fn().mockRejectedValue(new Error("Conexión perdida con la base de datos"));
        }
        return () => brokenChain;
      }
    });

    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue(brokenChain),
    });

    const res = await checkRateLimit({ 
      key: "login:intento", 
      maxAttempts: 5, 
      windowMinutes: 15 
    });

    expect(res.allowed).toBe(false); 
    expect(res.remaining).toBe(0);
    expect(res.resetIn).toBe(15);
  });

  it("permite el acceso controlado en modo FAIL-OPEN si se define explícitamente isCritical en false", async () => {
    const brokenChain = new Proxy({}, {
      get(target, prop: string) {
        if (prop === "then") return undefined;
        if (prop === "maybeSingle") {
          return vi.fn().mockRejectedValue(new Error("Timeout de lectura"));
        }
        return () => brokenChain;
      }
    });

    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue(brokenChain),
    });

    const res = await checkRateLimit({ 
      key: "vista:no-critica", 
      maxAttempts: 10, 
      windowMinutes: 5, 
      isCritical: false 
    });

    expect(res.allowed).toBe(true); 
    expect(res.remaining).toBe(0);
  });
});