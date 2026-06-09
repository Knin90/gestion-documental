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

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
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

function mockUsuarioAutenticado() {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "user@test.com" } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  });
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
    mockUsuarioAutenticado();
    const res = await importarDocumentos("recibido", []);
    expect(res.success).toBe(false);
    expect(res.error).toBe("No hay filas para importar");
  });

  it("importa documentos recibidos correctamente", async () => {
    mockUsuarioAutenticado();
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    const res = await importarDocumentos("recibido", FILAS_MOCK);
    expect(res.success).toBe(true);
    expect(res.importados).toBe(2);
  });

  it("importa documentos enviados correctamente", async () => {
    mockUsuarioAutenticado();
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    const res = await importarDocumentos("enviado", FILAS_MOCK);
    expect(res.success).toBe(true);
    expect(res.importados).toBe(2);
  });

  it("asigna el tipo correcto a cada registro", async () => {
    mockUsuarioAutenticado();
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({ insert: insertMock }),
    });
    await importarDocumentos("enviado", FILAS_MOCK);
    const registros = insertMock.mock.calls[0][0];
    expect(registros.every((r: any) => r.type === "enviado")).toBe(true);
  });

  it("asigna created_by con el id del usuario autenticado", async () => {
    mockUsuarioAutenticado();
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({ insert: insertMock }),
    });
    await importarDocumentos("recibido", FILAS_MOCK);
    const registros = insertMock.mock.calls[0][0];
    expect(registros.every((r: any) => r.created_by === "user-123")).toBe(true);
  });

  it("retorna error si falla el insert en Supabase", async () => {
    mockUsuarioAutenticado();
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: "db error" } }),
      }),
    });
    const res = await importarDocumentos("recibido", FILAS_MOCK);
    expect(res.success).toBe(false);
    expect(res.error).toBe("Error al importar los documentos");
  });

  it("importa una sola fila correctamente", async () => {
    mockUsuarioAutenticado();
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    const res = await importarDocumentos("recibido", [FILAS_MOCK[0]]);
    expect(res.success).toBe(true);
    expect(res.importados).toBe(1);
  });
});

// ─── obtenerDocumentosParaExportar ────────────────────────────────────────────

describe("obtenerDocumentosParaExportar", () => {
  it("redirige a login si no hay usuario autenticado", async () => {
    mockUsuarioNoAutenticado();
    await expect(obtenerDocumentosParaExportar("recibido")).rejects.toThrow("REDIRECT:/login");
  });

  it("retorna documentos recibidos correctamente", async () => {
    const docs = [
      { document_id: "N-001", description: "Nota 1", signed_by: "Juan", addressed_to: "Dep A", document_date: "2025-01-15", pdf_url: null },
      { document_id: "N-002", description: "Nota 2", signed_by: "Maria", addressed_to: "Dep B", document_date: "2025-01-16", pdf_url: "https://url.com/doc.pdf" },
    ];
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: docs, error: null }),
      }),
    });
    const res = await obtenerDocumentosParaExportar("recibido");
    expect(res.success).toBe(true);
    expect(res.documentos).toHaveLength(2);
    expect(res.documentos[0].document_id).toBe("N-001");
  });

  it("retorna array vacio si no hay documentos", async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });
    const res = await obtenerDocumentosParaExportar("enviado");
    expect(res.success).toBe(true);
    expect(res.documentos).toEqual([]);
  });

  it("retorna error si falla la consulta a Supabase", async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "db error" } }),
      }),
    });
    const res = await obtenerDocumentosParaExportar("recibido");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Error al obtener los documentos");
    expect(res.documentos).toEqual([]);
  });

  it("no mezcla documentos enviados con recibidos", async () => {
    const docs = [
      { document_id: "E-001", description: "Enviado 1", signed_by: "Juan", addressed_to: "Dep A", document_date: "2025-01-15", pdf_url: null },
    ];
    let capturedEqArgs: any[] = [];
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col: string, val: string) => {
          capturedEqArgs.push({ col, val });
          return {
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: docs, error: null }),
          };
        }),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: docs, error: null }),
      }),
    });
    await obtenerDocumentosParaExportar("enviado");
    expect(capturedEqArgs.some((a) => a.val === "enviado")).toBe(true);
  });
});
