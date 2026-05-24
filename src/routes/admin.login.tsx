import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Login — Area Riservata" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/admin" });
  },
  component: LoginPage,
});

const credsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email non valida").max(255),
  password: z
    .string()
    .min(8, "La password deve avere almeno 8 caratteri")
    .max(72, "La password è troppo lunga"),
});

const RL_KEY = "admin_login_rl_v1";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function readAttempts(): number[] {
  try {
    const raw = localStorage.getItem(RL_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function recordFailure() {
  const now = Date.now();
  const next = [...readAttempts().filter((t) => now - t < WINDOW_MS), now];
  localStorage.setItem(RL_KEY, JSON.stringify(next));
}

function clearAttempts() {
  localStorage.removeItem(RL_KEY);
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const now = Date.now();
    const recent = readAttempts().filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_ATTEMPTS) {
      const wait = Math.ceil((WINDOW_MS - (now - recent[0])) / 60000);
      setError(`Troppi tentativi. Riprova tra ~${wait} min.`);
      return;
    }

    setLoading(true);
    try {
      const parsed = credsSchema.safeParse({ email, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Dati non validi");
        return;
      }
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
      if (signInError || !signInData.user) {
        recordFailure();
        setError("Credenziali non valide.");
        return;
      }
      // Restrict access: only admin can stay logged in.
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", signInData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) {
        await supabase.auth.signOut();
        recordFailure();
        setError("Accesso non autorizzato.");
        return;
      }
      clearAttempts();
      await navigate({ to: "/admin" });
    } catch {
      setError("Errore imprevisto. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 max-w-md mx-auto px-6 py-20 md:py-28 w-full">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          /admin · Accesso
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tighter italic mb-3">
          Area Riservata
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-10 text-sm">
          Accesso riservato all'amministratore.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              className="w-full bg-background border border-border px-4 py-2.5 text-sm font-display focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border px-4 py-2.5 text-sm font-display focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {error && (
            <div className="border border-destructive/30 bg-destructive/5 text-destructive px-4 py-3 text-sm font-display">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-foreground text-background font-display text-[11px] font-bold uppercase tracking-wider hover:bg-primary transition-colors disabled:opacity-50"
          >
            {loading ? "Attendere…" : "Accedi"}
          </button>
        </form>

        <div className="mt-8 flex justify-end items-center text-xs">
          <Link
            to="/"
            className="font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Torna al sito
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
