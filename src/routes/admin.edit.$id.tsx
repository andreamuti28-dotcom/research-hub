import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { AdminGuard } from "@/components/AdminGuard";
import { PaperForm, type PaperFormValues } from "@/components/PaperForm";
import { getPaperForEdit, updatePaper } from "@/lib/admin-papers.functions";

export const Route = createFileRoute("/admin/edit/$id")({
  head: () => ({
    meta: [
      { title: "Modifica Paper — Area Riservata" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/admin/login" });
  },
  component: () => (
    <AdminGuard>
      <EditPaper />
    </AdminGuard>
  ),
});

function EditPaper() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getFn = useServerFn(getPaperForEdit);
  const updateFn = useServerFn(updatePaper);
  const [error, setError] = useState<string | null>(null);

  const paperQuery = useQuery({
    queryKey: ["admin", "paper", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const mutation = useMutation({
    mutationFn: async (v: PaperFormValues) =>
      updateFn({
        data: {
          id,
          slug: v.slug,
          title: v.title,
          abstract: v.abstract,
          content: v.content,
          tags: v.tags,
          pdfUrl: v.pdfUrl ? v.pdfUrl : null,
          publishedDate: v.publishedDate,
          publishAt: v.publishAt ? v.publishAt : null,
          isPublished: v.isPublished,
          language: v.language,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "papers"] });
      queryClient.invalidateQueries({ queryKey: ["papers"] });
      navigate({ to: "/admin" });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Errore sconosciuto"),
  });

  if (paperQuery.isLoading) {
    return (
      <AdminShell title="Caricamento…">
        <div className="font-mono text-xs text-surface-dark-foreground/60">
          Caricamento paper…
        </div>
      </AdminShell>
    );
  }
  if (!paperQuery.data) {
    return (
      <AdminShell title="Paper non trovato">
        <p className="text-surface-dark-foreground/70">Il paper non esiste o è stato eliminato.</p>
      </AdminShell>
    );
  }

  const p = paperQuery.data as typeof paperQuery.data & { publish_at?: string | null };
  const publishAtLocal = p.publish_at
    ? new Date(p.publish_at).toISOString().slice(0, 16)
    : "";
  const initial: PaperFormValues = {
    slug: p.slug,
    title: p.title,
    abstract: p.abstract,
    content: p.content ?? "",
    tags: p.tags ?? [],
    pdfUrl: p.pdf_url ?? "",
    publishedDate: p.published_date,
    publishAt: publishAtLocal,
    isPublished: p.is_published,
    language: (p.language ?? "it") as PaperFormValues["language"],
  };

  return (
    <AdminShell title={`Modifica: ${p.title}`}>
      <PaperForm
        initial={initial}
        submitLabel="Salva modifiche"
        pending={mutation.isPending}
        error={error}
        onSubmit={(v) => {
          setError(null);
          mutation.mutate(v);
        }}
      />
    </AdminShell>
  );
}
