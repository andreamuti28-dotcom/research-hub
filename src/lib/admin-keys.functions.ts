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
  value: string | null;
  secret: boolean;
  description: string;
};

export const getProjectKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProjectKey[]> => {
    await assertAdmin(context.userId);

    const env = process.env;
    return [
      {
        name: "VITE_SUPABASE_URL",
        value: env.SUPABASE_URL ?? null,
        secret: false,
        description: "URL pubblico del backend (Supabase). Usato dal frontend.",
      },
      {
        name: "VITE_SUPABASE_PUBLISHABLE_KEY",
        value: env.SUPABASE_PUBLISHABLE_KEY ?? null,
        secret: false,
        description: "Chiave pubblica (anon) del backend. Sicura da esporre.",
      },
      {
        name: "VITE_SUPABASE_PROJECT_ID",
        value: env.SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? null,
        secret: false,
        description: "ID del progetto Supabase/Lovable Cloud.",
      },
      {
        name: "SUPABASE_URL",
        value: env.SUPABASE_URL ?? null,
        secret: false,
        description: "URL backend (lato server). Stesso valore di VITE_SUPABASE_URL.",
      },
      {
        name: "SUPABASE_PUBLISHABLE_KEY",
        value: env.SUPABASE_PUBLISHABLE_KEY ?? null,
        secret: false,
        description: "Anon key lato server.",
      },
      {
        name: "SUPABASE_SERVICE_ROLE_KEY",
        value: env.SUPABASE_SERVICE_ROLE_KEY ?? null,
        secret: true,
        description: "⚠️ Chiave admin. Bypassa RLS. MAI esporre al frontend.",
      },
      {
        name: "LOVABLE_API_KEY",
        value: env.LOVABLE_API_KEY ?? null,
        secret: true,
        description: "Chiave Lovable AI Gateway. Usata per traduzioni e AI.",
      },
      {
        name: "MARKET_REPORTS_WEBHOOK_SECRET",
        value: env.MARKET_REPORTS_WEBHOOK_SECRET ?? null,
        secret: true,
        description: "Secret per autenticare il webhook dei report di mercato.",
      },
    ];
  });
