import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { invitarUsuario, cambiarPermisoUsuario, cambiarRolUsuario, cambiarPermisoExportar } from "../invite";

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
      insert: vi.fn().mockReturnThis(),
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
