import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { checkAdminStatus } from "@/lib/admin-papers.functions";
import { listPublishedPapers } from "@/lib/papers.functions";
import {
  getSiteSettings,
  updateSiteSettings,
  uploadSitePortrait,
} from "@/lib/site-settings.functions";
import { cropTo4x5Jpeg } from "@/lib/image-crop";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Profilo & Sito — Area Riservata" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/admin/login" });
  },
  component: AdminSettingsPage,
});

type FormState = {
  name: string;
  heroTitle: string;
  heroIntro: string;
  linkedinUrl: string;
  portraitUrl: string | null;
  featuredPaperIds: string[];
};

function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const checkAdmin = useServerFn(checkAdminStatus);
  const getSettings = useServerFn(getSiteSettings);
  const updateFn = useServerFn(updateSiteSettings);
  const uploadPortrait = useServerFn(uploadSitePortrait);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sessionReady, setSessionReady] = useState(false);
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

  const adminQuery = useQuery({
    queryKey: ["admin", "status"],
    queryFn: () => checkAdmin(),
    enabled: sessionReady,
    retry: false,
  });

  const settingsQuery = useQuery({
    queryKey: ["admin", "site-settings"],
    queryFn: () => getSettings(),
    enabled: adminQuery.data?.isAdmin === true,
  });

  const listPapersFn = useServerFn(listPublishedPapers);
  const papersQuery = useQuery({
    queryKey: ["papers", "published"],
    queryFn: () => listPapersFn(),
    enabled: adminQuery.data?.isAdmin === true,
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settingsQuery.data && !form) {
      setForm({
        name: settingsQuery.data.name,
        heroTitle: settingsQuery.data.heroTitle,
        heroIntro: settingsQuery.data.heroIntro,
        linkedinUrl: settingsQuery.data.linkedinUrl,
        portraitUrl: settingsQuery.data.portraitUrl,
        featuredPaperIds: settingsQuery.data.featuredPaperIds,
      });
    }
  }, [settingsQuery.data, form]);

  const saveMutation = useMutation({
    mutationFn: (data: FormState) => updateFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["papers"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (adminQuery.isLoading) {
    return (
      <AdminShell title="Caricamento…">
        <div className="font-mono text-xs text-surface-dark-foreground/60">
          Verifica accesso…
        </div>
      </AdminShell>
    );
  }

  if (!adminQuery.data?.isAdmin) {
    return (
      <AdminShell title="Accesso non autorizzato">
        <p className="text-surface-dark-foreground/70">
          Solo gli admin possono modificare il sito.
        </p>
      </AdminShell>
    );
  }

  if (!form) {
    return (
      <AdminShell title="Profilo & Sito">
        <div className="font-mono text-xs text-surface-dark-foreground/60">
          Caricamento impostazioni…
        </div>
      </AdminShell>
    );
  }

  const handleUpload = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const processed = await cropTo4x5Jpeg(file);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Impossibile leggere l'immagine."));
        reader.readAsDataURL(processed);
      });
      const { publicUrl } = await uploadPortrait({
        data: { fileName: file.name, mimeType: "image/jpeg", base64 },
      });
      setForm((f) => (f ? { ...f, portraitUrl: publicUrl } : f));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload fallito");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    saveMutation.mutate(form);
  };

  return (
    <AdminShell title="Profilo & Sito">
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-10">
        {/* Foto homepage */}
        <section className="border border-surface-dark-muted p-6 space-y-4">
          <h2 className="font-display text-sm uppercase tracking-widest text-surface-dark-foreground/70">
            Foto homepage (sotto "LinkedIn Profile")
          </h2>
          <div className="flex items-start gap-6">
            <div className="w-32 aspect-[4/5] bg-surface-dark-muted overflow-hidden border border-surface-dark-muted flex-shrink-0">
              {form.portraitUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.portraitUrl}
                  alt="Anteprima foto profilo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/40 text-center px-2">
                  Nessuna foto<br />caricata
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-background text-foreground font-display text-[11px] font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                {uploading ? "Caricamento…" : form.portraitUrl ? "Sostituisci foto" : "Carica foto"}
              </button>
              {form.portraitUrl && (
                <button
                  type="button"
                  onClick={() => setForm((f) => (f ? { ...f, portraitUrl: null } : f))}
                  className="ml-3 px-4 py-2 border border-surface-dark-muted font-display text-[11px] font-bold uppercase tracking-wider hover:border-destructive hover:text-destructive transition-colors"
                >
                  Rimuovi
                </button>
              )}
              {uploadError && (
                <div className="font-mono text-[11px] text-destructive">{uploadError}</div>
              )}
              <p className="font-mono text-[10px] text-surface-dark-foreground/50 leading-relaxed">
                L'immagine viene ritagliata automaticamente in formato 4:5. Nessun limite di peso.
              </p>
            </div>
          </div>
        </section>

        {/* Testi */}
        <section className="border border-surface-dark-muted p-6 space-y-5">
          <h2 className="font-display text-sm uppercase tracking-widest text-surface-dark-foreground/70">
            Identità & bio
          </h2>

          <Field label="Nome">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              required
              maxLength={120}
            />
          </Field>

          <Field label="Titolo principale (hero)">
            <textarea
              value={form.heroTitle}
              onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
              className={`${inputCls} min-h-[80px]`}
              required
              maxLength={500}
            />
          </Field>

          <Field label="Bio / introduzione">
            <textarea
              value={form.heroIntro}
              onChange={(e) => setForm({ ...form, heroIntro: e.target.value })}
              className={`${inputCls} min-h-[140px]`}
              required
              maxLength={2000}
            />
          </Field>

          <Field label="URL LinkedIn">
            <input
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
              className={inputCls}
              required
              maxLength={500}
            />
          </Field>
        </section>

        {/* Paper in evidenza */}
        <section className="border border-surface-dark-muted p-6 space-y-5">
          <div>
            <h2 className="font-display text-sm uppercase tracking-widest text-surface-dark-foreground/70">
              Paper in evidenza (homepage)
            </h2>
            <p className="font-mono text-[10px] text-surface-dark-foreground/50 mt-2 leading-relaxed">
              Seleziona fino a 3 paper da mettere in evidenza sopra la sezione "Ultimi Paper".
              Lascia vuoto per nascondere uno slot.
            </p>
          </div>
          {[0, 1, 2].map((slot) => {
            const value = form.featuredPaperIds[slot] ?? "";
            const otherSelected = form.featuredPaperIds.filter((_, i) => i !== slot);
            return (
              <Field key={slot} label={`Slot ${slot + 1}`}>
                <select
                  value={value}
                  onChange={(e) => {
                    const next = [...form.featuredPaperIds];
                    next[slot] = e.target.value;
                    setForm({
                      ...form,
                      featuredPaperIds: next.filter((id) => id && id.length > 0),
                    });
                  }}
                  className={inputCls}
                >
                  <option value="">— Nessuno —</option>
                  {(papersQuery.data ?? [])
                    .filter((p) => p.id === value || !otherSelected.includes(p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                </select>
              </Field>
            );
          })}
        </section>


        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-6 py-3 bg-background text-foreground font-display text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? "Salvataggio…" : "Salva modifiche"}
          </button>
          {saved && (
            <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-400">
              ✓ Salvato
            </span>
          )}
          {saveMutation.isError && (
            <span className="font-mono text-[11px] text-destructive">
              {(saveMutation.error as Error).message}
            </span>
          )}
        </div>
      </form>
    </AdminShell>
  );
}

const inputCls =
  "w-full bg-surface-dark border border-surface-dark-muted px-3 py-2 text-background font-serif text-sm focus:outline-none focus:border-background";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
        {label}
      </span>
      {children}
    </label>
  );
}

