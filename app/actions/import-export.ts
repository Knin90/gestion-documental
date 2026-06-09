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

  const registros = filas.map((fila) => ({
    type: tipo,
    document_id: fila.document_id,
    description: fila.description,
    signed_by: fila.signed_by,
    addressed_to: fila.addressed_to,
    document_date: fila.document_date,
    created_by: user.id,
  }));

  const admin = getAdminClient();
  const { error } = await admin.from("documents").insert(registros);

  if (error) {
    console.error("Error al importar documentos:", error.message);
    return { success: false, error: "Error al importar los documentos" };
  }

  return { success: true, importados: registros.length };
}

export async function obtenerDocumentosParaExportar(tipo: "recibido" | "enviado") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("documents")
    .select("document_id, description, signed_by, addressed_to, document_date, pdf_url")
    .eq("type", tipo)
    .is("deleted_at", null)
    .order("document_date", { ascending: false });

  if (error) {
    console.error("Error al obtener documentos:", error.message);
    return { success: false, error: "Error al obtener los documentos", documentos: [] };
  }

  const { data: perfil } = await supabase.from("profiles").select("org_id, email").eq("id", user.id).single();
  if (perfil) {
    await registrarAuditLog({
      org_id: perfil.org_id,
      user_id: user.id,
      user_email: perfil.email,
      action: "exportar_documentos",
      entity: "documento",
      details: { tipo, cantidad: data?.length ?? 0 },
    });
  }

  return { success: true, documentos: data ?? [] };
}
