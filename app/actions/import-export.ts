"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { registrarAuditLog } from "@/app/actions/audit";

type ActionResult = {
  success: boolean;
  error?: string;
  importados?: number;
};

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface FilaImportar {
  document_id: string | null;
  description: string;
  signed_by: string | null;
  addressed_to: string | null;
  document_date: string;
}

// ─── Importación Segura Multi-Tenant ─────────────────────────────────────────
export async function importarDocumentos(
  tipo: "recibido" | "enviado",
  filas: FilaImportar[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (filas.length === 0) {
    return { success: false, error: "No hay filas para importar" };
  }

  // 1. Obtener rigurosamente el org_id antes de permitir la inserción masiva
  const { data: perfil, error: errorPerfil } = await supabase
    .from("profiles")
    .select("org_id, email")
    .eq("id", user.id)
    .single();

  if (errorPerfil || !perfil?.org_id) {
    return { success: false, error: "Tu cuenta no está asociada a ninguna organización." };
  }

  // 2. Inyectar obligatoriamente el org_id a cada documento del lote
  const registros = filas.map((fila) => ({
    type: tipo,
    document_id: fila.document_id,
    description: fila.description,
    signed_by: fila.signed_by,
    addressed_to: fila.addressed_to,
    document_date: fila.document_date,
    created_by: user.id,
    org_id: perfil.org_id, // ◄--- Corrección crítica: vincula el lote al Tenant
  }));

  const admin = getAdminClient();
  const { error } = await admin.from("documents").insert(registros);

  if (error) {
    console.error("Error al importar documentos:", error.message);
    return { success: false, error: "Error al importar los documentos" };
  }

  // 3. Registro de auditoría para operaciones masivas
  await registrarAuditLog({
    org_id: perfil.org_id,
    user_id: user.id,
    user_email: perfil.email,
    action: "importar_documentos",
    entity: "documento",
    details: { tipo, cantidad: registros.length },
  });

  return { success: true, importados: registros.length };
}

// ─── Exportación Segura Multi-Tenant ─────────────────────────────────────────
export async function obtenerDocumentosParaExportar(tipo: "recibido" | "enviado") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Obtener primero el perfil para conocer el Tenant ID legítimo
  const { data: perfil, error: errorPerfil } = await supabase
    .from("profiles")
    .select("org_id, email")
    .eq("id", user.id)
    .single();

  if (errorPerfil || !perfil?.org_id) {
    console.error("Error al verificar organización del usuario:", errorPerfil?.message);
    return { success: false, error: "Tu cuenta no está asociada a ninguna organización.", documentos: [] };
  }

  // 2. Restringir la consulta usando de forma explícita el org_id obtenido
  const { data, error } = await supabase
    .from("documents")
    .select("document_id, description, signed_by, addressed_to, document_date, pdf_url")
    .eq("type", tipo)
    .eq("org_id", perfil.org_id) // ◄--- Filtro inquebrantable de aislamiento
    .is("deleted_at", null)
    .order("document_date", { ascending: false });

  if (error) {
    console.error("Error al obtener documentos para exportar:", error.message);
    return { success: false, error: "Error al obtener los documentos", documentos: [] };
  }

  // 3. Auditoría con datos garantizados
  await registrarAuditLog({
    org_id: perfil.org_id,
    user_id: user.id,
    user_email: perfil.email,
    action: "exportar_documentos",
    entity: "documento",
    details: { tipo, cantidad: data?.length ?? 0 },
  });

  return { success: true, documentos: data ?? [] };
}