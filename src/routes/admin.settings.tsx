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
  uploadSiteLogo,
  uploadSiteFavicon,
  type LanguageItem,
  type LogoItem,
  type EducationItem,
} from "@/lib/site-settings.functions";
import { cropTo4x5Jpeg, cropFaviconPng, cropFaviconPngFromUrl } from "@/lib/image-crop";
import {
  getLatestMarketReport,
  upsertCurrentMarketReport,
} from "@/lib/market-reports.functions";

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
  contactEmail: string;
  portraitUrl: string | null;
  featuredPaperIds: string[];
  homeFeaturedLabel: string;
  homeMarketLabel: string;
  homeMarketEnabled: boolean;
  homeMarketDisclaimer: string;
  archiveDisclaimer: string;
  headerBg: string;
  newsApiUrl: string;
  newsCountdownColor: string;
  faviconUrl: string | null;
  faviconOriginalUrl: string | null;
  faviconPosX: number;
  faviconPosY: number;



  aboutRole: string;
  aboutBio: string;
  aboutKicker: string;
  aboutEducationLabel: string;
  aboutLanguagesLabel: string;
  aboutSoftwareLabel: string;
  aboutCertificationsLabel: string;
  aboutPanelBg: string;
  aboutPanelFg: string;
  aboutLanguagesBarColor: string;
  aboutLanguagesBarTrackColor: string;
  aboutLogoMaxWidth: number;
  aboutPortraitPosX: number;
  aboutPortraitPosY: number;
  aboutTooltipBg: string;
  aboutTooltipFg: string;
  aboutTooltipBorder: string;
  aboutEducation: EducationItem[];
  aboutLanguages: LanguageItem[];
  aboutSoftware: LogoItem[];
  aboutCertifications: LogoItem[];
};

function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const checkAdmin = useServerFn(checkAdminStatus);
  const getSettings = useServerFn(getSiteSettings);
  const updateFn = useServerFn(updateSiteSettings);
  const uploadPortrait = useServerFn(uploadSitePortrait);
  const uploadLogo = useServerFn(uploadSiteLogo);
  const uploadFavicon = useServerFn(uploadSiteFavicon);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [faviconBusy, setFaviconBusy] = useState(false);
  const [faviconError, setFaviconError] = useState<string | null>(null);
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
      const s = settingsQuery.data;
      setForm({
        name: s.name,
        heroTitle: s.heroTitle,
        heroIntro: s.heroIntro,
        linkedinUrl: s.linkedinUrl,
        contactEmail: s.contactEmail,
        portraitUrl: s.portraitUrl,
        featuredPaperIds: s.featuredPaperIds,
        homeFeaturedLabel: s.homeFeaturedLabel,
        homeMarketLabel: s.homeMarketLabel,
        homeMarketEnabled: s.homeMarketEnabled,
        homeMarketDisclaimer: s.homeMarketDisclaimer,
        archiveDisclaimer: s.archiveDisclaimer,
        headerBg: s.headerBg,
        newsApiUrl: s.newsApiUrl,
        newsCountdownColor: s.newsCountdownColor,
        faviconUrl: s.faviconUrl,
        faviconOriginalUrl: s.faviconOriginalUrl,
        faviconPosX: s.faviconPosX,
        faviconPosY: s.faviconPosY,



        aboutRole: s.aboutRole,
        aboutBio: s.aboutBio,
        aboutKicker: s.aboutKicker,
        aboutEducationLabel: s.aboutEducationLabel,
        aboutLanguagesLabel: s.aboutLanguagesLabel,
        aboutSoftwareLabel: s.aboutSoftwareLabel,
        aboutCertificationsLabel: s.aboutCertificationsLabel,
        aboutPanelBg: s.aboutPanelBg,
        aboutPanelFg: s.aboutPanelFg,
        aboutLanguagesBarColor: s.aboutLanguagesBarColor,
        aboutLanguagesBarTrackColor: s.aboutLanguagesBarTrackColor,
        aboutLogoMaxWidth: s.aboutLogoMaxWidth,
        aboutPortraitPosX: s.aboutPortraitPosX,
        aboutPortraitPosY: s.aboutPortraitPosY,
        aboutTooltipBg: s.aboutTooltipBg,
        aboutTooltipFg: s.aboutTooltipFg,
        aboutTooltipBorder: s.aboutTooltipBorder,
        aboutEducation: s.aboutEducation,
        aboutLanguages: s.aboutLanguages,
        aboutSoftware: s.aboutSoftware,
        aboutCertifications: s.aboutCertifications,
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
    saveMutation.mutate({
      ...form,
      featuredPaperIds: form.featuredPaperIds.filter((id) => id && id.length > 0),
    });
  };

  return (
    <AdminShell title="Profilo & Sito">
      <form onSubmit={handleSubmit} className="max-w-5xl space-y-10">
        {/* Foto profilo (About) */}
        <section className="border border-surface-dark-muted p-6 space-y-4">
          <h2 className="font-display text-sm uppercase tracking-widest text-surface-dark-foreground/70">
            Foto profilo (pagina About)
          </h2>
          <div className="flex items-start gap-6 flex-wrap">
            <div className="w-40 h-40 rounded-full bg-surface-dark-muted overflow-hidden border border-surface-dark-muted flex-shrink-0">
              {form.portraitUrl ? (
                <img
                  src={form.portraitUrl}
                  alt="Anteprima foto profilo"
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: `${form.aboutPortraitPosX}% ${form.aboutPortraitPosY}%`,
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/40 text-center px-2">
                  Nessuna foto<br />caricata
                </div>
              )}
            </div>
            <div className="flex-1 min-w-[260px] space-y-3">
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
              <div>
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
              </div>
              {uploadError && (
                <div className="font-mono text-[11px] text-destructive">{uploadError}</div>
              )}
              <p className="font-mono text-[10px] text-surface-dark-foreground/50 leading-relaxed">
                L'immagine viene ritagliata in un cerchio. Trascina il punto focale sulla griglia per scegliere cosa mostrare.
              </p>
            </div>
          </div>

          {form.portraitUrl && (
            <PortraitFocusPicker
              src={form.portraitUrl}
              posX={form.aboutPortraitPosX}
              posY={form.aboutPortraitPosY}
              onChange={(x, y) =>
                setForm((f) => (f ? { ...f, aboutPortraitPosX: x, aboutPortraitPosY: y } : f))
              }
            />
          )}
        </section>

        {/* Identità */}
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
              className={`${inputCls} min-h-[90px]`}
              required
              maxLength={500}
            />
          </Field>

          <Field label="Bio / introduzione">
            <textarea
              value={form.heroIntro}
              onChange={(e) => setForm({ ...form, heroIntro: e.target.value })}
              className={`${inputCls} min-h-[160px]`}
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

          <Field label="Email di contatto (mostrata nel footer)">
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className={inputCls}
              maxLength={254}
              placeholder="nome@dominio.com"
            />
          </Field>
        </section>

        {/* Featured papers */}
        <section className="border border-surface-dark-muted p-6 space-y-5">
          <div>
            <h2 className="font-display text-sm uppercase tracking-widest text-surface-dark-foreground/70">
              Paper in evidenza (homepage)
            </h2>
            <p className="font-mono text-[10px] text-surface-dark-foreground/50 mt-2 leading-relaxed">
              Seleziona fino a 3 paper da mettere in evidenza.
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
                    const next: string[] = [
                      form.featuredPaperIds[0] ?? "",
                      form.featuredPaperIds[1] ?? "",
                      form.featuredPaperIds[2] ?? "",
                    ];
                    next[slot] = e.target.value;
                    setForm({ ...form, featuredPaperIds: next });
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

        {/* Home — collapsibles labels */}
        <section className="border border-surface-dark-muted p-6 space-y-5">
          <h2 className="font-display text-sm uppercase tracking-widest text-surface-dark-foreground/70">
            Home — pulsanti espandibili
          </h2>
          <Field label="Etichetta pulsante 'Paper in Evidenza'">
            <input
              type="text"
              value={form.homeFeaturedLabel}
              onChange={(e) => setForm({ ...form, homeFeaturedLabel: e.target.value })}
              className={inputCls}
              required
              maxLength={120}
            />
          </Field>
          <Field label="Etichetta pulsante 'Analisi Mercati Finanziari'">
            <input
              type="text"
              value={form.homeMarketLabel}
              onChange={(e) => setForm({ ...form, homeMarketLabel: e.target.value })}
              className={inputCls}
              required
              maxLength={120}
            />
          </Field>
          <label className="flex items-center gap-3 text-surface-dark-foreground/80">
            <input
              type="checkbox"
              checked={form.homeMarketEnabled}
              onChange={(e) => setForm({ ...form, homeMarketEnabled: e.target.checked })}
            />
            <span className="font-mono text-[11px] uppercase tracking-widest">
              Mostra sezione mercati nella home
            </span>
          </label>
          <Field label="Disclaimer sotto al report finanziario (home)">
            <input
              type="text"
              value={form.homeMarketDisclaimer}
              onChange={(e) => setForm({ ...form, homeMarketDisclaimer: e.target.value })}
              className={inputCls}
              maxLength={300}
            />
          </Field>
          <Field label="Disclaimer sotto al titolo 'Ricerca Pubblicata' (archivio)">
            <input
              type="text"
              value={form.archiveDisclaimer}
              onChange={(e) => setForm({ ...form, archiveDisclaimer: e.target.value })}
              className={inputCls}
              maxLength={300}
            />
          </Field>
          <Field label="URL feed News Finanziarie (Google Apps Script)">
            <input
              type="url"
              value={form.newsApiUrl}
              onChange={(e) => setForm({ ...form, newsApiUrl: e.target.value })}
              className={inputCls}
              required
              maxLength={1000}
              placeholder="https://script.google.com/macros/s/..../exec"
            />
          </Field>
          <Field label="Colore barra countdown News (5s all'apertura)">
            <ColorField
              value={form.newsCountdownColor}
              onChange={(v) => setForm({ ...form, newsCountdownColor: v })}
            />
          </Field>
          <Field label="Colore sfondo header (navigazione)">
            <div className="space-y-2">
              <ColorField
                value={form.headerBg}
                onChange={(v) => setForm({ ...form, headerBg: v })}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, headerBg: "" })}
                  className="px-3 py-1.5 border border-surface-dark-muted font-display text-[10px] font-bold uppercase tracking-wider hover:border-background hover:text-background transition-colors"
                >
                  Nessun colore
                </button>
                <span className="font-mono text-[10px] text-surface-dark-foreground/50">
                  {form.headerBg
                    ? "Colore personalizzato attivo"
                    : "Automatico: bianco in chiaro, nero in scuro"}
                </span>
              </div>
            </div>
          </Field>
          <MarketReportEditorPanel />
          <MarketReportsIntegrationPanel />

        </section>



        {/* About Me */}
        <section className="border border-surface-dark-muted p-6 space-y-6">
          <div>
            <h2 className="font-display text-sm uppercase tracking-widest text-surface-dark-foreground/70">
              About Me (pagina /about)
            </h2>
            <p className="font-mono text-[10px] text-surface-dark-foreground/50 mt-2 leading-relaxed">
              4 colonne: Formazione, Lingue, Software & AI, Certificazioni.
            </p>
          </div>

          <Field label="Ruolo / sottotitolo">
            <input
              type="text"
              value={form.aboutRole}
              onChange={(e) => setForm({ ...form, aboutRole: e.target.value })}
              className={inputCls}
              required
              maxLength={120}
            />
          </Field>

          <Field label="Biografia (usa righe vuote per nuovi paragrafi)">
            <textarea
              value={form.aboutBio}
              onChange={(e) => setForm({ ...form, aboutBio: e.target.value })}
              className={`${inputCls} min-h-[200px]`}
              required
              maxLength={5000}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label='Etichetta sopra il nome (es. "Chi sono")'>
              <input
                type="text"
                value={form.aboutKicker}
                onChange={(e) => setForm({ ...form, aboutKicker: e.target.value })}
                className={inputCls}
                required
                maxLength={60}
              />
            </Field>
            <Field label="Titolo sezione Formazione">
              <input
                type="text"
                value={form.aboutEducationLabel}
                onChange={(e) => setForm({ ...form, aboutEducationLabel: e.target.value })}
                className={inputCls}
                required
                maxLength={60}
              />
            </Field>
            <Field label="Titolo sezione Lingue">
              <input
                type="text"
                value={form.aboutLanguagesLabel}
                onChange={(e) => setForm({ ...form, aboutLanguagesLabel: e.target.value })}
                className={inputCls}
                required
                maxLength={60}
              />
            </Field>
            <Field label="Titolo sezione Software & AI">
              <input
                type="text"
                value={form.aboutSoftwareLabel}
                onChange={(e) => setForm({ ...form, aboutSoftwareLabel: e.target.value })}
                className={inputCls}
                required
                maxLength={60}
              />
            </Field>
            <Field label="Titolo sezione Certificazioni">
              <input
                type="text"
                value={form.aboutCertificationsLabel}
                onChange={(e) => setForm({ ...form, aboutCertificationsLabel: e.target.value })}
                className={inputCls}
                required
                maxLength={60}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Colore sfondo pannello">
              <ColorField
                value={form.aboutPanelBg}
                onChange={(v) => setForm({ ...form, aboutPanelBg: v })}
              />
            </Field>
            <Field label="Colore testo pannello">
              <ColorField
                value={form.aboutPanelFg}
                onChange={(v) => setForm({ ...form, aboutPanelFg: v })}
              />
            </Field>
            <Field label="Colore barra lingue (riempimento)">
              <ColorField
                value={form.aboutLanguagesBarColor}
                onChange={(v) => setForm({ ...form, aboutLanguagesBarColor: v })}
              />
            </Field>
            <Field label="Colore sfondo barra lingue (vuoto)">
              <ColorField
                value={form.aboutLanguagesBarTrackColor}
                onChange={(v) => setForm({ ...form, aboutLanguagesBarTrackColor: v })}
              />
            </Field>
          </div>

          <Field label="Dimensione loghi Software & Certificazioni (px, 16–200)">
            <input
              type="number"
              min={16}
              max={200}
              value={form.aboutLogoMaxWidth}
              onChange={(e) =>
                setForm({
                  ...form,
                  aboutLogoMaxWidth: Math.max(16, Math.min(200, Number(e.target.value) || 48)),
                })
              }
              className={inputCls}
            />
          </Field>

          {/* Tooltip controls */}
          <div className="border-t border-surface-dark-muted pt-6 space-y-4">
            <h3 className="font-display text-xs uppercase tracking-widest text-surface-dark-foreground/70">
              Tooltip (al passaggio del mouse)
            </h3>
            <p className="font-mono text-[10px] text-surface-dark-foreground/50 leading-relaxed">
              Compaiono quando l'utente passa il mouse sopra le voci della formazione, lingue, software e certificazioni. Lascia vuoto il campo "tooltip" di un elemento per nasconderlo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Sfondo tooltip">
                <ColorField
                  value={form.aboutTooltipBg}
                  onChange={(v) => setForm({ ...form, aboutTooltipBg: v })}
                />
              </Field>
              <Field label="Testo tooltip">
                <ColorField
                  value={form.aboutTooltipFg}
                  onChange={(v) => setForm({ ...form, aboutTooltipFg: v })}
                />
              </Field>
              <Field label="Bordo tooltip">
                <ColorField
                  value={form.aboutTooltipBorder}
                  onChange={(v) => setForm({ ...form, aboutTooltipBorder: v })}
                />
              </Field>
            </div>
          </div>

          <EducationEditor
            items={form.aboutEducation}
            onChange={(items) => setForm({ ...form, aboutEducation: items })}
          />

          <LanguageEditor
            items={form.aboutLanguages}
            onChange={(items) => setForm({ ...form, aboutLanguages: items })}
            uploadLogo={uploadLogo}
          />

          <LogoListEditor
            label="Software & AI (voci)"
            folder="software"
            items={form.aboutSoftware}
            onChange={(items) => setForm({ ...form, aboutSoftware: items })}
            placeholder="es. Illustrator, ChatGPT"
            uploadLogo={uploadLogo}
          />

          <LogoListEditor
            label="Certificazioni (voci)"
            folder="certifications"
            items={form.aboutCertifications}
            onChange={(items) => setForm({ ...form, aboutCertifications: items })}
            placeholder="es. AWS Cloud Practitioner"
            uploadLogo={uploadLogo}
          />
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
  "w-full bg-white border border-neutral-300 rounded-sm px-4 py-3 text-neutral-900 font-sans text-base leading-normal focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-neutral-400 shadow-sm";

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

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const normalize = (v: string) => {
    const s = v.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) return s;
    return value;
  };
  const colorPickerValue = /^#[0-9a-fA-F]{6}$/.test(value)
    ? value
    : /^#[0-9a-fA-F]{8}$/.test(value)
      ? value.slice(0, 7)
      : "#000000";
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={colorPickerValue}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-14 cursor-pointer rounded border border-neutral-300 bg-white"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(normalize(e.target.value))}
        placeholder="#000000"
        className={`${inputCls} flex-1`}
        maxLength={9}
      />
    </div>
  );
}

function EducationEditor({
  items,
  onChange,
}: {
  items: EducationItem[];
  onChange: (next: EducationItem[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
        Formazione (voci)
      </div>
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="border border-surface-dark-muted/50 rounded-sm p-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-start">
              <input
                type="text"
                value={it.name}
                placeholder="Titolo (es. Master in Design)"
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...it, name: e.target.value };
                  onChange(next);
                }}
                className={inputCls}
                maxLength={120}
              />
              <input
                type="text"
                value={it.detail}
                placeholder="Istituto / anno (es. Politecnico, 2022)"
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...it, detail: e.target.value };
                  onChange(next);
                }}
                className={inputCls}
                maxLength={300}
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="h-12 px-3 border border-surface-dark-muted text-[10px] uppercase tracking-widest font-display hover:border-destructive hover:text-destructive"
              >
                ×
              </button>
            </div>
            <textarea
              value={it.description}
              placeholder="Testo tooltip (lascia vuoto per nascondere)"
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...it, description: e.target.value };
                onChange(next);
              }}
              className={`${inputCls} min-h-[60px]`}
              maxLength={300}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([...items, { name: "", detail: "", description: "" }])
        }
        className="px-3 py-1.5 border border-surface-dark-muted text-[10px] uppercase tracking-widest font-display font-bold hover:border-background hover:text-background"
      >
        + Aggiungi formazione
      </button>
    </div>
  );
}

function LanguageEditor({
  items,
  onChange,
  uploadLogo,
}: {
  items: LanguageItem[];
  onChange: (next: LanguageItem[]) => void;
  uploadLogo: (args: {
    data: {
      fileName: string;
      mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";
      folder: "software" | "certifications" | "languages";
      base64: string;
    };
  }) => Promise<{ publicUrl: string }>;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleFlagFile = async (idx: number, file: File) => {
    setErr(null);
    setBusy(idx);
    try {
      const mime = file.type;
      if (
        mime !== "image/png" &&
        mime !== "image/jpeg" &&
        mime !== "image/webp" &&
        mime !== "image/svg+xml"
      ) {
        throw new Error("Formato non supportato (PNG, JPG, WEBP, SVG).");
      }
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Impossibile leggere il file."));
        reader.readAsDataURL(file);
      });
      const { publicUrl } = await uploadLogo({
        data: { fileName: file.name, mimeType: mime, folder: "languages", base64 },
      });
      const next = [...items];
      next[idx] = { ...next[idx], flagUrl: publicUrl };
      onChange(next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload fallito");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
        Lingue (voci) — emoji bandiera oppure carica un'immagine
      </div>
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="border border-surface-dark-muted/50 rounded-sm p-3 space-y-2">
            <div className="grid grid-cols-[80px_72px_1fr_110px_auto] gap-2 items-center">
              <div className="w-20 h-12 bg-white rounded-sm border border-neutral-300 flex items-center justify-center overflow-hidden">
                {it.flagUrl ? (
                  <img src={it.flagUrl} alt="" className="w-full h-full object-cover" />
                ) : it.flag ? (
                  <span className="text-2xl leading-none">{it.flag}</span>
                ) : (
                  <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                    no flag
                  </span>
                )}
              </div>
              <input
                type="text"
                value={it.flag}
                placeholder="🇮🇹"
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...it, flag: e.target.value };
                  onChange(next);
                }}
                className={`${inputCls} text-center text-2xl px-1`}
                maxLength={8}
              />
              <input
                type="text"
                value={it.name}
                placeholder="Italiano"
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...it, name: e.target.value };
                  onChange(next);
                }}
                className={inputCls}
                maxLength={60}
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={it.level}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = {
                      ...it,
                      level: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                    };
                    onChange(next);
                  }}
                  className={inputCls}
                />
                <span className="font-mono text-[10px] text-surface-dark-foreground/50">%</span>
              </div>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="h-12 px-3 border border-surface-dark-muted text-[10px] uppercase tracking-widest font-display hover:border-destructive hover:text-destructive"
              >
                ×
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3 py-2 border border-surface-dark-muted text-[10px] uppercase tracking-widest font-display font-bold cursor-pointer hover:border-background hover:text-background">
                {busy === i ? "Carico…" : it.flagUrl ? "Sostituisci bandiera" : "Carica bandiera"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFlagFile(i, f);
                    e.target.value = "";
                  }}
                />
              </label>
              {it.flagUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const next = [...items];
                    next[i] = { ...it, flagUrl: null };
                    onChange(next);
                  }}
                  className="px-3 py-2 border border-surface-dark-muted text-[10px] uppercase tracking-widest font-display hover:border-destructive hover:text-destructive"
                >
                  Rimuovi bandiera
                </button>
              )}
            </div>
            <textarea
              value={it.description}
              placeholder="Testo tooltip (lascia vuoto per nascondere)"
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...it, description: e.target.value };
                onChange(next);
              }}
              className={`${inputCls} min-h-[60px]`}
              maxLength={300}
            />
          </div>
        ))}
      </div>
      {err && <div className="font-mono text-[11px] text-destructive">{err}</div>}
      <button
        type="button"
        onClick={() =>
          onChange([...items, { name: "", level: 80, flag: "", flagUrl: null, description: "" }])
        }
        className="px-3 py-1.5 border border-surface-dark-muted text-[10px] uppercase tracking-widest font-display font-bold hover:border-background hover:text-background"
      >
        + Aggiungi lingua
      </button>
    </div>
  );
}

function LogoListEditor({
  label,
  folder,
  items,
  onChange,
  placeholder,
  uploadLogo,
}: {
  label: string;
  folder: "software" | "certifications";
  items: LogoItem[];
  onChange: (next: LogoItem[]) => void;
  placeholder?: string;
  uploadLogo: (args: {
    data: {
      fileName: string;
      mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";
      folder: "software" | "certifications";
      base64: string;
    };
  }) => Promise<{ publicUrl: string }>;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (idx: number, file: File) => {
    setErr(null);
    setBusy(idx);
    try {
      const mime = file.type;
      if (
        mime !== "image/png" &&
        mime !== "image/jpeg" &&
        mime !== "image/webp" &&
        mime !== "image/svg+xml"
      ) {
        throw new Error("Formato non supportato (usa PNG, JPG, WEBP o SVG).");
      }
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Impossibile leggere il file."));
        reader.readAsDataURL(file);
      });
      const { publicUrl } = await uploadLogo({
        data: { fileName: file.name, mimeType: mime, folder, base64 },
      });
      const next = [...items];
      next[idx] = { ...next[idx], logoUrl: publicUrl };
      onChange(next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload fallito");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
        {label}
      </div>
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="border border-surface-dark-muted/50 rounded-sm p-3 space-y-2">
            <div className="grid grid-cols-[64px_1fr_auto_auto] gap-2 items-center">
              <div className="w-16 h-16 bg-white rounded-sm border border-neutral-300 flex items-center justify-center overflow-hidden">
                {it.logoUrl ? (
                  <img
                    src={it.logoUrl}
                    alt={it.name}
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                    no logo
                  </span>
                )}
              </div>
              <input
                type="text"
                value={it.name}
                placeholder={placeholder}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...it, name: e.target.value };
                  onChange(next);
                }}
                className={inputCls}
                maxLength={60}
              />
              <label className="px-3 py-3 border border-surface-dark-muted text-[10px] uppercase tracking-widest font-display font-bold cursor-pointer hover:border-background hover:text-background">
                {busy === i ? "Carico…" : it.logoUrl ? "Sostituisci" : "Logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(i, f);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="h-12 px-3 border border-surface-dark-muted text-[10px] uppercase tracking-widest font-display hover:border-destructive hover:text-destructive"
              >
                ×
              </button>
            </div>
            <textarea
              value={it.description}
              placeholder="Testo tooltip (lascia vuoto per nascondere)"
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...it, description: e.target.value };
                onChange(next);
              }}
              className={`${inputCls} min-h-[60px]`}
              maxLength={300}
            />
          </div>
        ))}
      </div>
      {err && <div className="font-mono text-[11px] text-destructive">{err}</div>}
      <button
        type="button"
        onClick={() =>
          onChange([...items, { name: "", logoUrl: null, description: "" }])
        }
        className="px-3 py-1.5 border border-surface-dark-muted text-[10px] uppercase tracking-widest font-display font-bold hover:border-background hover:text-background"
      >
        + Aggiungi
      </button>
    </div>
  );
}

function MarketReportEditorPanel() {
  const queryClient = useQueryClient();
  const loadFn = useServerFn(getLatestMarketReport);
  const saveFn = useServerFn(upsertCurrentMarketReport);

  const reportQuery = useQuery({
    queryKey: ["admin", "market-report", "current"],
    queryFn: () => loadFn(),
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [source, setSource] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    if (reportQuery.data === undefined) return;
    initRef.current = true;
    const r = reportQuery.data;
    setTitle(r?.title ?? "Report mercati");
    setContent(r?.content ?? "");
    setReportDate(r?.reportDate ?? new Date().toISOString().slice(0, 10));
    setSource(r?.source ?? "");
  }, [reportQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          title: title.trim() || "Report mercati",
          content,
          reportDate: reportDate || undefined,
          source: source.trim() ? source.trim() : null,
        },
      }),
    onSuccess: () => {
      setSavedAt(Date.now());
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "market-report", "current"] });
      queryClient.invalidateQueries({ queryKey: ["market-report", "latest"] });
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "Errore durante il salvataggio");
    },
  });

  const handleReload = () => {
    initRef.current = false;
    reportQuery.refetch();
  };

  return (
    <div className="space-y-3 border-t border-surface-dark-muted pt-5">
      <div>
        <h3 className="font-display text-xs uppercase tracking-widest text-surface-dark-foreground/80 mb-2">
          Report mercati — modifica manuale
        </h3>
        <p className="font-mono text-[11px] text-surface-dark-foreground/60 leading-relaxed">
          Modifica direttamente il report attuale (quello mostrato in home).
          Sovrascrive il contenuto ricevuto da Google Apps Script.
        </p>
      </div>

      {reportQuery.isLoading ? (
        <div className="font-mono text-[11px] text-surface-dark-foreground/50">
          Caricamento report…
        </div>
      ) : (
        <>
          <Field label="Titolo">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              maxLength={300}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Data (YYYY-MM-DD)">
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Fonte (opzionale)">
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={inputCls}
                maxLength={200}
              />
            </Field>
          </div>
          <Field label="Contenuto (testo, max 200.000 caratteri)">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`${inputCls} min-h-[260px] font-mono text-[12px] leading-relaxed`}
              maxLength={200_000}
            />
          </Field>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !content.trim()}
              className="px-4 py-2 bg-background text-foreground font-display text-[11px] font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
            >
              {saveMutation.isPending ? "Salvataggio…" : "Salva report"}
            </button>
            <button
              type="button"
              onClick={handleReload}
              className="px-3 py-2 border border-surface-dark-muted font-display text-[10px] font-bold uppercase tracking-wider hover:border-background hover:text-background transition-colors"
            >
              Ricarica
            </button>
            {savedAt && !saveMutation.isPending && (
              <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">
                Salvato
              </span>
            )}
            {error && (
              <span className="font-mono text-[10px] text-destructive">{error}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MarketReportsIntegrationPanel() {
  const webhookUrl =
    "https://project--34b2a20e-95a6-4f33-89b6-7087554072b8.lovable.app/api/public/market-reports";

  const appsScript = `// === Lovable — Invio Report Mercati ===
// 1) In Apps Script: File > Project properties > Script properties
//    Aggiungi una property con chiave WEBHOOK_SECRET e valore = MARKET_REPORTS_WEBHOOK_SECRET.
// 2) Esegui sendDailyMarketReport() una volta a mano per autorizzare lo script.
// 3) Triggers > Add Trigger: sendDailyMarketReport, Time-driven, Day timer, 07:00.

const WEBHOOK_URL = '${webhookUrl}';

function sendDailyMarketReport() {
  const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  if (!secret) throw new Error('Manca la Script Property WEBHOOK_SECRET');

  const today = Utilities.formatDate(new Date(), 'Europe/Rome', 'yyyy-MM-dd');

  // === Personalizza qui il contenuto del report ===
  const payload = {
    title: 'Report mercati ' + today,
    // Testo semplice. I ritorni a capo vengono mantenuti.
    content: [
      'Sintesi della giornata:',
      '- S&P 500: ...',
      '- Nasdaq: ...',
      '- FTSE MIB: ...',
      '',
      'Note: ...'
    ].join('\\n'),
    reportDate: today,
    source: 'Google Apps Script'
  };

  const res = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + secret },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  Logger.log(res.getResponseCode() + ' ' + res.getContentText());
}
`;

  const curlExample = `curl -X POST '${webhookUrl}' \\
  -H 'Authorization: Bearer <MARKET_REPORTS_WEBHOOK_SECRET>' \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"Report mercati","content":"Riga 1\\nRiga 2","reportDate":"2026-05-23","source":"Apps Script"}'`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const boxCls =
    "w-full font-mono text-[11px] leading-relaxed bg-surface-dark text-surface-dark-foreground border border-surface-dark-muted p-3 whitespace-pre overflow-auto";
  const btnCls =
    "px-2.5 py-1 border border-surface-dark-muted text-[10px] uppercase tracking-widest font-display font-bold hover:border-background hover:text-background";

  return (
    <div className="space-y-5 border-t border-surface-dark-muted pt-5">
      <div>
        <h3 className="font-display text-xs uppercase tracking-widest text-surface-dark-foreground/80 mb-2">
          Integrazione Google Apps Script
        </h3>
        <p className="font-mono text-[11px] text-surface-dark-foreground/60 leading-relaxed">
          L'endpoint riceve un report al giorno e lo mostra in tempo reale nella
          home. Formato preferito del campo <code>content</code>: <strong>testo
          semplice</strong> con ritorni a capo (i newline vengono preservati).
          Il Markdown viene mostrato come testo grezzo — non è interpretato.
          Lunghezza massima 200.000 caratteri.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
            Webhook URL (POST)
          </span>
          <button type="button" onClick={() => copy(webhookUrl)} className={btnCls}>
            Copia
          </button>
        </div>
        <div className={boxCls}>{webhookUrl}</div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
            Header di autenticazione
          </span>
        </div>
        <div className={boxCls}>
          Authorization: Bearer &lt;MARKET_REPORTS_WEBHOOK_SECRET&gt;
          {"\n"}# in alternativa: x-webhook-secret: &lt;MARKET_REPORTS_WEBHOOK_SECRET&gt;
        </div>
        <p className="font-mono text-[10px] text-surface-dark-foreground/50 leading-relaxed">
          Il valore del secret è già configurato lato server (Lovable Cloud →
          Secrets → <code>MARKET_REPORTS_WEBHOOK_SECRET</code>). Copialo da lì
          e incollalo come Script Property nello script Google.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
            Schema JSON del body
          </span>
        </div>
        <div className={boxCls}>{`{
  "title": "Report mercati",          // opzionale, max 300 char
  "content": "Riga 1\\nRiga 2 ...",    // obbligatorio, testo, max 200000 char
  "reportDate": "YYYY-MM-DD",          // opzionale, default = oggi (UTC)
  "source": "Google Apps Script"       // opzionale, max 200 char
}`}</div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
            Test rapido (curl)
          </span>
          <button type="button" onClick={() => copy(curlExample)} className={btnCls}>
            Copia
          </button>
        </div>
        <div className={boxCls}>{curlExample}</div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
            Script pronto per Google Apps Script
          </span>
          <button type="button" onClick={() => copy(appsScript)} className={btnCls}>
            Copia tutto
          </button>
        </div>
        <textarea
          readOnly
          value={appsScript}
          className={`${boxCls} min-h-[280px]`}
          onFocus={(e) => e.currentTarget.select()}
        />
        <p className="font-mono text-[10px] text-surface-dark-foreground/50 leading-relaxed">
          Passi: 1) script.google.com → Nuovo progetto → incolla.{" "}
          2) Impostazioni progetto → Proprietà script → aggiungi{" "}
          <code>WEBHOOK_SECRET</code>. 3) Esegui una volta per autorizzare.{" "}
          4) Trigger → Aggiungi: <code>sendDailyMarketReport</code>, time-driven,
          ogni giorno all'orario desiderato.
        </p>
      </div>

      <div className="font-mono text-[10px] text-surface-dark-foreground/50 leading-relaxed">
        Risposte: <code>201</code> = creato · <code>401</code> = secret errato ·
        <code>400</code> = JSON o payload non valido · <code>503</code> = secret
        mancante lato server.
      </div>
    </div>
  );
}

function PortraitFocusPicker({
  src,
  posX,
  posY,
  onChange,
}: {
  src: string;
  posX: number;
  posY: number;
  onChange: (x: number, y: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const update = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const x = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
    onChange(Math.round(x), Math.round(y));
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/70">
        Punto focale — trascina sulla griglia
      </div>
      <div
        ref={ref}
        className="relative inline-block select-none touch-none cursor-crosshair border border-surface-dark-muted bg-black/40"
        onPointerDown={(e) => {
          draggingRef.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          update(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) update(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          draggingRef.current = false;
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }}
      >
        <img
          src={src}
          alt=""
          className="block max-h-[360px] max-w-full pointer-events-none"
          draggable={false}
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
        </div>
        <div
          className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.7)] pointer-events-none"
          style={{ left: `${posX}%`, top: `${posY}%` }}
        />
      </div>
      <div className="font-mono text-[10px] text-surface-dark-foreground/50">
        X: {posX}% · Y: {posY}%
      </div>
    </div>
  );
}
