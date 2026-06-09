"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface AuditLogParams {
  org_id: string;
  user_id: string;
  user_email: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: Record<string, unknown>;
}

export async function registrarAuditLog(params: AuditLogParams) {
  try {
    const admin = getAdminClient();
    await admin.from("audit_logs").insert(params);
  } catch (err) {
    console.error("Error registrando audit log:", err);
  }
}
