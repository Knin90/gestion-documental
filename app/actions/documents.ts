"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { documentoSchema } from "@/lib/schemas/document";

type ActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

export async function crearDocumento(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  const { data, error } = await supabase
    .from("documents")
    .insert({ ...resultado.data, created_by: user.id })
    .select("id")
    .single();

  if (error) {
    console.error("Error al crear documento:", error.message);
    return { success: false, error: "Error al guardar el documento" };
  }

  revalidatePath("/documentos");
  revalidatePath("/dashboard");
  return { success: true, id: data.id };
}

export async function actualizarDocumento(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  const { error } = await supabase
    .from("documents")
    .update({ ...resultado.data, updated_by: user.id })
    .eq("id", id)
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

export async function eliminarDocumento(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("Error al eliminar documento:", error.message);
    return { success: false, error: "Error al eliminar el documento" };
  }

  revalidatePath("/documentos");
  revalidatePath("/dashboard");
  return { success: true };
}
