import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error("REDIRECT:" + url);
  }),
}));

vi.mock("@/app/actions/audit", () => ({
  registrarAuditLog: vi.fn().mockResolvedValue(null),
}));

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { importarDocumentos, obtenerDocumentosParaExportar } from "../import-export";

const FILAS_MOCK = [
  {
    document_id: "N-001",
    description: "Nota de prueba",
    signed_by: "Juan Perez",
    addressed_to: "Departamento A",
    document_date: "2025-01-15",
  },
  {
    document_id: "N-002",
    description: "Otra nota",
    signed_by: "Maria Lopez",
    addressed_to: "Departamento B",
    document_date: "2025-01-16",
  },
];

// Helper dinámico para interceptar llamadas por tabla
function mockSupabaseMultiTenant(options: { documentData?: any; documentError?: any } = {}) {
  const mockFrom = vi.fn().mockImplementation((tabla: string) => {
    if (tabla === "profiles") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { org_id: "org-123", email: "user@test.com" } }),
      };
    }
    if (tabla === "documents") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: options.documentData ?? [], 
          error: options.documentError ?? null 
        }),
      };
    }
    return {};
  });

  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "user@test.com" } },
      }),
    },
    from: mockFrom,
  });

  return mockFrom;
}

function mockUsuarioNoAutenticado() {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});

// ─── importarDocumentos ───────────────────────────────────────────────────────

describe("importarDocumentos", () => {
  it("redirige a login si no hay usuario autenticado", async () => {
    mockUsuarioNoAutenticado();
    await expect(importarDocumentos("recibido", FILAS_MOCK)).rejects.toThrow("REDIRECT:/login");
  });

  it("rechaza si no hay filas para importar", async () => {
    mockSupabaseMultiTenant();
    const res = await importarDocumentos("recibido", []);
    expect(res.success).toBe(false);
    expect(res.error).toBe("No hay filas para importar");
  });

  it("importa documentos recibidos e inyecta el org_id de forma mandatoria", async () => {
    mockSupabaseMultiTenant();
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({ insert: insertMock }),
    });

    const res = await importarDocumentos("recibido", FILAS_MOCK);
    expect(res.success).toBe(true);
    expect(res.importados).toBe(2);

    // Asegurar aislamiento Multi-Tenant en la inserción masiva
    const registrosInsertados = insertMock.mock.calls[0][0];
    expect(registrosInsertados.every((r: any) => r.org_id === "org-123")).toBe(true);
  });

  it("asigna el tipo correcto y el autor original a cada registro del lote", async () => {
    mockSupabaseMultiTenant();
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({ insert: insertMock }),
    });

    await importarDocumentos("enviado", FILAS_MOCK);
    const registros = insertMock.mock.calls[0][0];
    expect(registros.every((r: any) => r.type === "enviado")).toBe(true);
    expect(registros.every((r: any) => r.created_by === "user-123")).toBe(true);
  });

  it("retorna error si falla el insert administrativo de Supabase", async () => {
    mockSupabaseMultiTenant();
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: "db error" } }),
      }),
    });

    const res = await importarDocumentos("recibido", FILAS_MOCK);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Error al importar los documentos");
  });
});

// ─── obtenerDocumentosParaExportar ────────────────────────────────────────────

describe("obtenerDocumentosParaExportar", () => {
  it("redirige a login si no hay usuario autenticado", async () => {
    mockUsuarioNoAutenticado();
    await expect(obtenerDocumentosParaExportar("recibido")).rejects.toThrow("REDIRECT:/login");
  });

  it("restringe la exportación estrictamente al tenant (org_id) del usuario", async () => {
    const docs = [
      { document_id: "N-001", description: "Nota 1", signed_by: "Juan", addressed_to: "Dep A", document_date: "2025-01-15", pdf_url: null },
    ];
    
    const eqMock = vi.fn().mockReturnThis();
    const isMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockResolvedValue({ data: docs, error: null });

    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
      },
      from: vi.fn().mockImplementation((tabla: string) => {
        if (tabla === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { org_id: "org-123", email: "user@test.com" } }),
          };
        }
        if (tabla === "documents") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: eqMock,
            is: isMock,
            order: orderMock,
          };
        }
        return {};
      }),
    });

    const res = await obtenerDocumentosParaExportar("recibido");
    expect(res.success).toBe(true);
    expect(res.documentos).toHaveLength(1);

    // ─── AQUÍ ESTÁ LA CORRECCIÓN ───────────────────────────────────────────
    expect(eqMock).toHaveBeenCalledWith("type", "recibido");
    expect(eqMock).toHaveBeenCalledWith("org_id", "org-123"); // Garantiza aislamiento
  });

  it("retorna un array vacío si el tenant no contiene documentos del tipo solicitado", async () => {
    mockSupabaseMultiTenant({ documentData: null });
    const res = await obtenerDocumentosParaExportar("enviado");
    expect(res.success).toBe(true);
    expect(res.documentos).toEqual([]);
  });

  it("retorna error controlado y un array vacío si la consulta a Supabase falla", async () => {
    mockSupabaseMultiTenant({ documentError: { message: "Error crítico de base de datos" } });
    const res = await obtenerDocumentosParaExportar("recibido");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Error al obtener los documentos");
    expect(res.documentos).toEqual([]);
  });
});