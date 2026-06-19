"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function marcarTodasLeidas() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) return { success: false, error: "Sin organización" };

  const admin = getAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read: true })
    .eq("org_id", profile.org_id)
    .eq("read", false);

  if (error) {
    console.error("marcarTodasLeidas:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function marcarUnaLeida(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) return { success: false, error: "Sin organización" };

  const admin = getAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("org_id", profile.org_id);

  if (error) {
    console.error("marcarUnaLeida:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function limpiarLeidas() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) return { success: false, error: "Sin organización" };

  const admin = getAdminClient();
  const { error } = await admin
    .from("notifications")
    .delete()
    .eq("org_id", profile.org_id)
    .eq("read", true);

  if (error) {
    console.error("limpiarLeidas:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
