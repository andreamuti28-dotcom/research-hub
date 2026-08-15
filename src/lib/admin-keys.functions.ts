import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export type ProjectKey = {
  name: string;
  /** Public values only. For secrets this is always null. */
  value: string | null;
  /** Masked preview (e.g. "••••ab12") shown for secrets. Never the raw value. */
  preview: string | null;
  configured: boolean;
  secret: boolean;
  description: string;
};

/** Never returns the raw secret: only a masked hint with the last 4 chars. */
function maskSecret(value: string | undefined | null): string | null {
  if (!value) return null;
  const tail = value.slice(-4);
  return `${"\u2022".repeat(8)}${tail}`;
}

function publicKey(name: string, value: string | null, description: string): ProjectKey {
  return { name, value, preview: value, configured: Boolean(value), secret: false, description };
}

function secretKey(name: string, value: string | undefined, description: string): ProjectKey {
  return {
    name,
    value: null,
    preview: maskSecret(value),
    configured: Boolean(value),
    secret: true,
    description,
  };
}

export const getProjectKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProjectKey[]> => {
    await assertAdmin(context.userId);

    const env = process.env;
    const projectId = env.SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? null;

    return [
      publicKey("VITE_SUPABASE_URL", env.SUPABASE_URL ?? null, "URL pubblico del backend. Usato dal frontend."),
      publicKey("VITE_SUPABASE_PUBLISHABLE_KEY", env.SUPABASE_PUBLISHABLE_KEY ?? null, "Chiave pubblica (anon) del backend. Sicura da esporre."),
      publicKey("VITE_SUPABASE_PROJECT_ID", projectId, "ID del progetto backend."),
      publicKey("SUPABASE_URL", env.SUPABASE_URL ?? null, "URL backend (lato server)."),
      publicKey("SUPABASE_PUBLISHABLE_KEY", env.SUPABASE_PUBLISHABLE_KEY ?? null, "Anon key lato server."),
      secretKey("SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY, "Chiave admin. Bypassa RLS. Gestibile solo dal gestore dei secret dell'hosting."),
      secretKey("LOVABLE_API_KEY", env.LOVABLE_API_KEY, "Chiave AI Gateway. Gestibile solo dal gestore dei secret dell'hosting."),
      secretKey("MARKET_REPORTS_WEBHOOK_SECRET", env.MARKET_REPORTS_WEBHOOK_SECRET, "Secret del webhook report di mercato. Gestibile solo dal gestore dei secret dell'hosting."),
    ];
  });
