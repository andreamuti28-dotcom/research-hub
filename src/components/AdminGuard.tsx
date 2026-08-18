import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Gates every /admin screen. While verifying — or when the signed-in user is
 * not an admin — nothing of the CMS chrome (nav, section names, logo) is
 * rendered: only a neutral full-screen message.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSessionReady(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSessionReady(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (sessionReady === false) {
      navigate({ to: "/admin/login", replace: true });
    }
  }, [sessionReady, navigate]);

  const adminQuery = useQuery({
    queryKey: ["admin", "status"],
    enabled: sessionReady === true,
    retry: false,
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      if (!uid) return { isAdmin: false };
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return { isAdmin: !!data };
    },
  });

  const onLogout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };

  if (sessionReady !== true || adminQuery.isLoading || adminQuery.isPending) {
    return <Neutral message="Verifica accesso in corso…" />;
  }

  if (!adminQuery.data?.isAdmin) {
    return (
      <Neutral message="Questa area non è disponibile per il tuo account.">
        <button
          type="button"
          onClick={onLogout}
          className="mt-6 px-4 py-2 border border-border font-display text-[11px] font-bold uppercase tracking-wider hover:border-foreground transition-colors"
        >
          Esci
        </button>
      </Neutral>
    );
  }

  return <>{children}</>;
}

function Neutral({
  message,
  children,
}: {
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {message}
        </p>
        {children}
      </div>
    </div>
  );
}
