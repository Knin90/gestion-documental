"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function marcarTodasLeidas() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) return { success: false };

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("org_id", profile.org_id)
    .eq("read", false);

  revalidatePath("/");
  return { success: true };
}

export async function marcarUnaLeida(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  revalidatePath("/");
  return { success: true };
}
