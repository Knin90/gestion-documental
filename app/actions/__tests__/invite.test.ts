import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/app/actions/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetIn: 60 }),
}));

vi.mock("@/app/actions/audit", () => ({
  registrarAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { invitarUsuario, eliminarUsuario, cambiarPermisoUsuario, cambiarRolUsuario, transferirPropiedad, cambiarPermisoExportar } from "../invite";

function mockNoAdmin() {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1", email: "a@a.com" } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "user", org_id: "org1" } }),
    }),
  });
}

function mockAdmin() {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1", email: "admin@a.com" } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "admin", org_id: "org1" } }),
    }),
  });
}

function mockAdminClient() {
  (createAdminClient as any).mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: "ABCD1234", error: null }),
    auth: { admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [] } }) } },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});

describe("invitarUsuario", () => {
  it("rechaza si el usuario no es admin", async () => {
    mockNoAdmin();
    const res = await invitarUsuario("Juan", "juan@test.com");
    expect(res.success).toBe(false);
    expect(res.error).toBe("No tienes permisos");
  });

  it("rechaza si nombre o correo estan vacios", async () => {
    mockAdmin();
    mockAdminClient();
    const res = await invitarUsuario("", "");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Nombre y correo son obligatorios");
  });

  it("rechaza si el correo ya existe", async () => {
    mockAdmin();
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "existing" } }),
      }),
      rpc: vi.fn(),
    });
    const res = await invitarUsuario("Juan", "juan@test.com");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Este correo ya está registrado");
  });

  it("invita correctamente y retorna access_code", async () => {
    mockAdmin();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    };
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue(fromMock),
      rpc: vi.fn().mockResolvedValue({ data: "ABCD1234", error: null }),
    });
    const res = await invitarUsuario("Juan", "juan@test.com", "editor", "user");
    expect(res.success).toBe(true);
    expect(res.access_code).toBe("ABCD1234");
  });
});

describe("cambiarPermisoUsuario", () => {
  it("rechaza si no es admin", async () => {
    mockNoAdmin();
    const res = await cambiarPermisoUsuario("otro@test.com", "viewer");
    expect(res.success).toBe(false);
  });

  it("rechaza cambiar el propio permiso", async () => {
    mockAdmin();
    mockAdminClient();
    const res = await cambiarPermisoUsuario("admin@a.com", "viewer");
    expect(res.success).toBe(false);
    expect(res.error).toBe("No puedes cambiar tu propio permiso");
  });

  it("actualiza permiso correctamente", async () => {
    mockAdmin();
    const chainMock = { error: null };
    const eqMock = vi.fn().mockImplementation(() => ({ ...chainMock, eq: eqMock }));
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: eqMock }),
        eq: eqMock,
      }),
    });
    const res = await cambiarPermisoUsuario("otro@test.com", "viewer");
    expect(res.success).toBe(true);
  });
});

describe("cambiarRolUsuario", () => {
  it("rechaza si no es admin", async () => {
    mockNoAdmin();
    const res = await cambiarRolUsuario("otro@test.com", "admin");
    expect(res.success).toBe(false);
  });

  it("rechaza cambiar el propio rol", async () => {
    mockAdmin();
    mockAdminClient();
    const res = await cambiarRolUsuario("admin@a.com", "user");
    expect(res.success).toBe(false);
    expect(res.error).toBe("No puedes cambiar tu propio rol");
  });

  it("rechaza cambiar rol del owner", async () => {
    mockAdmin();
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_owner: true } }),
        update: vi.fn().mockReturnThis(),
      }),
    });
    const res = await cambiarRolUsuario("owner@test.com", "user");
    expect(res.success).toBe(false);
    expect(res.error).toBe("No puedes cambiar el rol del propietario de la organización");
  });
});

describe("cambiarPermisoExportar", () => {
  it("rechaza si no es admin", async () => {
    mockNoAdmin();
    const res = await cambiarPermisoExportar("otro@test.com", true);
    expect(res.success).toBe(false);
  });

  it("habilita exportacion correctamente", async () => {
    mockAdmin();
    const eqMock = vi.fn().mockImplementation(() => ({ error: null, eq: eqMock }));
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: eqMock }),
      }),
    });
    const res = await cambiarPermisoExportar("otro@test.com", true);
    expect(res.success).toBe(true);
  });

  it("deshabilita exportacion correctamente", async () => {
    mockAdmin();
    const eqMock = vi.fn().mockImplementation(() => ({ error: null, eq: eqMock }));
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: eqMock }),
      }),
    });
    const res = await cambiarPermisoExportar("otro@test.com", false);
    expect(res.success).toBe(true);
  });
});

// ─── invitarUsuario casos adicionales ────────────────────────────────────────

describe("invitarUsuario - casos adicionales", () => {
  it("normaliza el correo a lowercase", async () => {
    mockAdmin();
    const fromMock = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    };
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue(fromMock),
      rpc: vi.fn().mockResolvedValue({ data: "ABCD1234", error: null }),
    });
    const res = await invitarUsuario("Juan", "JUAN@TEST.COM", "editor", "user");
    expect(res.success).toBe(true);
    const insertCall = fromMock.insert.mock.calls[0][0];
    expect(insertCall.email).toBe("juan@test.com");
  });

  it("rechaza si falla la generacion del codigo", async () => {
    mockAdmin();
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "rpc error" } }),
    });
    const res = await invitarUsuario("Juan", "juan@test.com");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Error al generar código");
  });

  it("rechaza si falla el insert en allowed_emails", async () => {
    mockAdmin();
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: { message: "insert error" } }),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      }),
      rpc: vi.fn().mockResolvedValue({ data: "ABCD1234", error: null }),
    });
    const res = await invitarUsuario("Juan", "juan@test.com");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Error al agregar usuario");
  });
});

// ─── eliminarUsuario ──────────────────────────────────────────────────────────

describe("eliminarUsuario", () => {
  it("rechaza si no es admin", async () => {
    mockNoAdmin();
    const res = await eliminarUsuario("otro@test.com");
    expect(res.success).toBe(false);
    expect(res.error).toBe("No tienes permisos");
  });

  it("rechaza eliminar el propio usuario", async () => {
    mockAdmin();
    mockAdminClient();
    const res = await eliminarUsuario("admin@a.com");
    expect(res.success).toBe(false);
    expect(res.error).toBe("No puedes eliminarte a ti mismo");
  });

  it("elimina usuario registrado correctamente", async () => {
    mockAdmin();
    const deleteAuthMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        delete: deleteMock,
        eq: eqMock,
      }),
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: { users: [{ id: "u99", email: "otro@test.com" }] },
          }),
          deleteUser: deleteAuthMock,
        },
      },
    });
    const res = await eliminarUsuario("otro@test.com");
    expect(res.success).toBe(true);
    expect(deleteAuthMock).toHaveBeenCalledWith("u99");
  });


  it("retorna error si falla deleteUser en auth", async () => {
    mockAdmin();
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: { users: [{ id: "u99", email: "otro@test.com" }] },
          }),
          deleteUser: vi.fn().mockResolvedValue({ error: { message: "auth error" } }),
        },
      },
    });
    const res = await eliminarUsuario("otro@test.com");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Error al eliminar usuario");
  });

  it("elimina usuario no registrado (solo en allowed_emails)", async () => {
    mockAdmin();
    const deleteMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        delete: deleteMock,
        eq: eqMock,
      }),
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({ data: { users: [] } }),
          deleteUser: vi.fn(),
        },
      },
    });
    const res = await eliminarUsuario("pendiente@test.com");
    expect(res.success).toBe(true);
  });
});

// ─── cambiarRolUsuario - casos adicionales ────────────────────────────────────

describe("cambiarRolUsuario - casos adicionales", () => {
  it("actualiza rol correctamente cuando no es owner", async () => {
    mockAdmin();
    const eqMock = vi.fn().mockImplementation(() => ({ error: null, eq: eqMock }));
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_owner: false } }),
        update: vi.fn().mockReturnValue({ eq: eqMock }),
      }),
    });
    const res = await cambiarRolUsuario("otro@test.com", "admin");
    expect(res.success).toBe(true);
  });
});

// ─── transferirPropiedad ──────────────────────────────────────────────────────

describe("transferirPropiedad", () => {
  it("rechaza si no es admin", async () => {
    mockNoAdmin();
    const res = await transferirPropiedad("nuevo@test.com");
    expect(res.success).toBe(false);
    expect(res.error).toBe("No tienes permisos");
  });

  it("rechaza si el que ejecuta no es owner", async () => {
    mockAdmin();
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_owner: false } }),
      }),
    });
    const res = await transferirPropiedad("nuevo@test.com");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Solo el propietario puede transferir la propiedad");
  });

  it("transfiere propiedad correctamente", async () => {
    mockAdmin();
    const eqMock = vi.fn().mockImplementation(() => ({ error: null, eq: eqMock }));
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_owner: true } }),
        update: updateMock,
        insert: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      })),
    });
    const res = await transferirPropiedad("nuevo@test.com");
    expect(res.success).toBe(true);
  });
});

// ─── cambiarPermisoUsuario - error en Supabase ────────────────────────────────

describe("cambiarPermisoUsuario - casos adicionales", () => {
  it("retorna error si falla la actualizacion en Supabase", async () => {
    mockAdmin();
    const eqMock = vi.fn().mockImplementation(() => ({ error: { message: "db error" }, eq: eqMock }));
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: eqMock }),
      }),
    });
    const res = await cambiarPermisoUsuario("otro@test.com", "viewer");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Error al actualizar permisos");
  });
});

// ─── Idempotencia ─────────────────────────────────────────────────────────────

describe("idempotencia", () => {
  it("eliminarUsuario dos veces no lanza error inesperado", async () => {
    mockAdmin();
    const deleteMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        delete: deleteMock,
        eq: eqMock,
      }),
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({ data: { users: [] } }),
          deleteUser: vi.fn(),
        },
      },
    });
    const res1 = await eliminarUsuario("otro@test.com");
    const res2 = await eliminarUsuario("otro@test.com");
    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
  });

  it("transferirPropiedad ejecutada dos veces retorna error en la segunda", async () => {
    mockAdmin();
    const eqMock = vi.fn().mockImplementation(() => ({ error: null, eq: eqMock }));
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

    // Primera ejecucion: es owner, transfiere OK
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_owner: true } }),
        update: updateMock,
      })),
    });
    const res1 = await transferirPropiedad("nuevo@test.com");
    expect(res1.success).toBe(true);

    // Segunda ejecucion: ya no es owner
    (createAdminClient as any).mockReturnValue({
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_owner: false } }),
        update: updateMock,
      })),
    });
    const res2 = await transferirPropiedad("nuevo@test.com");
    expect(res2.success).toBe(false);
    expect(res2.error).toBe("Solo el propietario puede transferir la propiedad");
  });
});
