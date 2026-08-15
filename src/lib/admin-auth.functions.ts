import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

const credsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(72),
});

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface AdminSignInResult {
  ok: boolean;
  error?: string;
  retryInMinutes?: number;
  session?: { access_token: string; refresh_token: string };
}

export const adminSignIn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credsSchema.parse(data))
  .handler(async ({ data }): Promise<AdminSignInResult> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const rawIp =
      getRequestHeader("cf-connecting-ip") ??
      getRequestIP({ xForwardedFor: true }) ??
      "unknown";
    const ipHash = await sha256(`login:${rawIp}`);
    const emailHash = await sha256(data.email);
    const since = new Date(
      Date.now() - WINDOW_MINUTES * 60 * 1000,
    ).toISOString();

    // Server-side rate limit: cannot be bypassed by the client.
    const { count } = await supabaseAdmin
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .eq("succeeded", false)
      .gte("created_at", since);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return {
        ok: false,
        error: "rate_limited",
        retryInMinutes: WINDOW_MINUTES,
      };
    }

    const authClient = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      {
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { data: signIn, error: signInError } =
      await authClient.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    const fail = async (message: string) => {
      await supabaseAdmin
        .from("login_attempts")
        .insert({ ip_hash: ipHash, email_hash: emailHash, succeeded: false });
      return { ok: false, error: message } satisfies AdminSignInResult;
    };

    if (signInError || !signIn.user || !signIn.session) {
      return fail("invalid_credentials");
    }

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", signIn.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      await authClient.auth.signOut();
      return fail("not_authorized");
    }

    await supabaseAdmin
      .from("login_attempts")
      .insert({ ip_hash: ipHash, email_hash: emailHash, succeeded: true });

    // Best-effort cleanup of old rows.
    await supabaseAdmin
      .from("login_attempts")
      .delete()
      .lt(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      );

    return {
      ok: true,
      session: {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
      },
    };
  });
