import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { PaperForm, emptyPaperForm, type PaperFormValues } from "@/components/PaperForm";
import { createPaper } from "@/lib/admin-papers.functions";

export const Route = createFileRoute("/admin/new")({
  head: () => ({
    meta: [
      { title: "Nuovo Paper — Area Riservata" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/admin/login" });
  },
  component: NewPaper,
});

function NewPaper() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createFn = useServerFn(createPaper);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (v: PaperFormValues) =>
      createFn({
        data: {
          slug: v.slug,
          title: v.title,
          abstract: v.abstract,
          content: v.content,
          tags: v.tags,
          pdfUrl: v.pdfUrl ? v.pdfUrl : null,
          publishedDate: v.publishedDate,
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

  return (
    <AdminShell title="Nuovo Paper">
      <PaperForm
        initial={emptyPaperForm}
        submitLabel="Pubblica paper"
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
