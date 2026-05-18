import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
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

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      await navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 max-w-md mx-auto px-6 py-20 md:py-28 w-full">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          /admin · {mode === "login" ? "Accesso" : "Registrazione"}
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tighter italic mb-3">
          Area Riservata
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-10 text-sm">
          {mode === "login"
            ? "Accedi per gestire i tuoi paper."
            : "Il primo account registrato diventa automaticamente amministratore."}
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
            {loading
              ? "Attendere…"
              : mode === "login"
                ? "Accedi"
                : "Crea account"}
          </button>
        </form>

        <div className="mt-8 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode(mode === "login" ? "signup" : "login");
            }}
            className="font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            {mode === "login" ? "→ Crea account" : "← Hai già un account?"}
          </button>
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
