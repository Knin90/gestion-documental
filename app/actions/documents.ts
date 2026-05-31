"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { documentoSchema } from "@/lib/schemas/document";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const TAMANO_MAXIMO_PDF = 15 * 1024 * 1024; // 15 MB

// ─── Helper: obtiene user + org_id en una sola llamada ───────────────────────
async function getUserAndOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  // Sin org_id el usuario no puede operar documentos
  if (!profile?.org_id) {
    return { user, orgId: null as string | null };
  }

  return { user, orgId: profile.org_id as string };
}

// ─── PDF upload ──────────────────────────────────────────────────────────────
async function subirPdf(archivo: File, documentId: string, userId: string) {
  if (archivo.size > TAMANO_MAXIMO_PDF) {
    return { error: "El PDF no puede superar 15 MB" };
  }
  if (archivo.type !== "application/pdf") {
    return { error: "Solo se permiten archivos PDF" };
  }

  const admin = getAdminClient();
  const extension = archivo.name.split(".").pop() ?? "pdf";
  const ruta = `${userId}/${documentId}.${extension}`;

  const { error } = await admin.storage
    .from("documents-pdfs")
    .upload(ruta, archivo, { upsert: true });

  if (error) {
    console.error("Error al subir PDF:", error.message);
    return { error: "Error al subir el PDF" };
  }

  return {
    pdf_url: ruta,
    pdf_filename: archivo.name,
    pdf_size_bytes: archivo.size,
  };
}

// ─── Crear documento ─────────────────────────────────────────────────────────
export async function crearDocumento(formData: FormData): Promise<ActionResult> {
  const { user, orgId } = await getUserAndOrg();

  if (!orgId) {
    return { success: false, error: "Tu cuenta no está asociada a ninguna organización." };
  }

  const resultado = documentoSchema.safeParse({
    type: formData.get("type"),
    document_id: formData.get("document_id") || null,
    description: formData.get("description"),
    signed_by: formData.get("signed_by") || null,
    addressed_to: formData.get("addressed_to") || null,
    document_date: formData.get("document_date"),
  });

  if (!resultado.success) {
    return { success: false, error: resultado.error.issues[0].message };
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("documents")
    .insert({
      ...resultado.data,
      created_by: user.id,
      org_id: orgId,           // ← vincula a la organización
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error al crear documento:", error.message);
    return { success: false, error: "Error al guardar el documento" };
  }

  const archivoPdf = formData.get("pdf") as File | null;
  if (archivoPdf && archivoPdf.size > 0) {
    const resPdf = await subirPdf(archivoPdf, data.id, user.id);
    if (resPdf.error) {
      return { success: false, error: resPdf.error };
    }
    await admin
      .from("documents")
      .update({
        pdf_url: resPdf.pdf_url,
        pdf_filename: resPdf.pdf_filename,
        pdf_size_bytes: resPdf.pdf_size_bytes,
      })
      .eq("id", data.id);
  }

  revalidatePath("/documentos");
  revalidatePath("/dashboard");
  return { success: true, id: data.id };
}

// ─── Actualizar documento ────────────────────────────────────────────────────
export async function actualizarDocumento(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const { user, orgId } = await getUserAndOrg();

  if (!orgId) {
    return { success: false, error: "Tu cuenta no está asociada a ninguna organización." };
  }

  const resultado = documentoSchema.safeParse({
    type: formData.get("type"),
    document_id: formData.get("document_id") || null,
    description: formData.get("description"),
    signed_by: formData.get("signed_by") || null,
    addressed_to: formData.get("addressed_to") || null,
    document_date: formData.get("document_date"),
  });

  if (!resultado.success) {
    return { success: false, error: resultado.error.issues[0].message };
  }

  const admin = getAdminClient();

  const archivoPdf = formData.get("pdf") as File | null;
  let datosPdf = {};

  if (archivoPdf && archivoPdf.size > 0) {
    const resPdf = await subirPdf(archivoPdf, id, user.id);
    if (resPdf.error) {
      return { success: false, error: resPdf.error };
    }
    datosPdf = {
      pdf_url: resPdf.pdf_url,
      pdf_filename: resPdf.pdf_filename,
      pdf_size_bytes: resPdf.pdf_size_bytes,
    };
  }

  const { error } = await admin
    .from("documents")
    .update({ ...resultado.data, ...datosPdf, updated_by: user.id })
    .eq("id", id)
    .eq("org_id", orgId)       // ← solo puede editar docs de su org
    .is("deleted_at", null);

  if (error) {
    console.error("Error al actualizar documento:", error.message);
    return { success: false, error: "Error al actualizar el documento" };
  }

  revalidatePath("/documentos");
  revalidatePath(`/documentos/${id}`);
  revalidatePath("/dashboard");
  return { success: true, id };
}

// ─── Eliminar documento (borrado lógico) ─────────────────────────────────────
export async function eliminarDocumento(id: string): Promise<ActionResult> {
  const { user, orgId } = await getUserAndOrg();

  if (!orgId) {
    return { success: false, error: "Tu cuenta no está asociada a ninguna organización." };
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("documents")
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", id)
    .eq("org_id", orgId)       // ← solo puede borrar docs de su org
    .is("deleted_at", null);

  if (error) {
    console.error("Error al eliminar documento:", error.message);
    return { success: false, error: "Error al eliminar el documento" };
  }

  revalidatePath("/documentos");
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── Eliminar todos los documentos de un tipo ────────────────────────────────
export async function eliminarTodosDocumentos(
  tipo: "recibido" | "enviado"
): Promise<ActionResult> {
  const { user, orgId } = await getUserAndOrg();

  if (!orgId) {
    return { success: false, error: "Tu cuenta no está asociada a ninguna organización." };
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("documents")
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .eq("type", tipo)
    .eq("org_id", orgId)       // ← CRÍTICO: solo borra los de su org
    .is("deleted_at", null);

  if (error) {
    console.error("Error al eliminar todos:", error.message);
    return { success: false, error: "Error al eliminar los documentos" };
  }

  revalidatePath("/documentos");
  revalidatePath("/dashboard");
  return { success: true };
}