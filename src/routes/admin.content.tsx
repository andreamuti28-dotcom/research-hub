import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { AdminGuard } from "@/components/AdminGuard";
import { siteSettingsQuery, useSiteSettings } from "@/hooks/use-site-settings";
import { updateSiteOverrides } from "@/lib/site-settings.functions";
import { I18N_KEYS, getDefaultString } from "@/lib/i18n";
import { listAllPapers } from "@/lib/admin-papers.functions";
import { defaultTagColor, tagTokenName } from "@/lib/paper-tags";
import { LANGUAGES, type Lang } from "@/hooks/use-language";

export const Route = createFileRoute("/admin/content")({
  head: () => ({
    meta: [
      { title: "Contenuti & Tema — Area Riservata" },
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
      <AdminContent />
    </AdminGuard>
  ),
});

// Group i18n keys by section prefix (text before the first dot)
function groupKeys(keys: string[]): Array<[string, string[]]> {
  const groups = new Map<string, string[]>();
  for (const k of keys) {
    const section = k.split(".")[0];
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section)!.push(k);
  }
  return Array.from(groups.entries());
}

const SECTION_LABELS: Record<string, string> = {
  nav: "Navigazione",
  footer: "Footer",
  home: "Home",
  archive: "Archivio",
  paper: "Paper",
  news: "News",
  about: "About",
  lang: "Lingue",
  langToggle: "Toggle lingua",
};

// Tema editabile: token semantici principali del sito
const THEME_TOKENS: Array<{ key: string; label: string; hint?: string }> = [
  { key: "--card-accent", label: "Linea card pubblicazioni" },
  { key: "--background", label: "Sfondo pagina" },

  { key: "--foreground", label: "Testo principale" },
  { key: "--primary", label: "Colore primario (link / CTA)" },
  { key: "--primary-foreground", label: "Testo su primario" },
  { key: "--muted", label: "Sfondo attenuato" },
  { key: "--muted-foreground", label: "Testo attenuato" },
  { key: "--accent", label: "Accento" },
  { key: "--accent-foreground", label: "Testo su accento" },
  { key: "--border", label: "Bordi" },
  { key: "--surface-dark", label: "Sfondo scuro (admin/footer)" },
  { key: "--surface-dark-foreground", label: "Testo su scuro" },
  { key: "--surface-dark-muted", label: "Bordo su scuro" },
];

function AdminContent() {
  const queryClient = useQueryClient();
  const settings = useSiteSettings();
  const updateFn = useServerFn(updateSiteOverrides);

  // Editable state, seeded from current settings
  const [i18n, setI18n] = useState<Record<string, { it?: string; en?: string }>>(
    () => ({ ...(settings.i18nOverrides ?? {}) }),
  );
  const [theme, setTheme] = useState<Record<string, string>>(
    () => ({ ...(settings.themeOverrides ?? {}) }),
  );
  const [filter, setFilter] = useState("");

  const groups = useMemo(() => groupKeys(I18N_KEYS as unknown as string[]), []);

  const papersFn = useServerFn(listAllPapers);
  const { data: papers } = useQuery({
    queryKey: ["admin", "papers", "tags"],
    queryFn: () => papersFn({}),
  });
  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const p of (papers ?? []) as Array<{ tags: string[] | null }>) {
      for (const t of p.tags ?? []) if (t.trim()) set.add(t.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [papers]);

  const mutation = useMutation({
    mutationFn: () =>
      updateFn({ data: { i18nOverrides: i18n, themeOverrides: theme } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteSettingsQuery.queryKey });
    },
  });

  const onTextChange = (key: string, lang: "it" | "en", value: string) => {
    setI18n((prev) => {
      const next = { ...prev };
      const entry = { ...(next[key] ?? {}) };
      if (value.trim().length === 0) {
        delete entry[lang];
      } else {
        entry[lang] = value;
      }
      if (entry.it === undefined && entry.en === undefined) {
        delete next[key];
      } else {
        next[key] = entry;
      }
      return next;
    });
  };

  const onThemeChange = (token: string, value: string) => {
    setTheme((prev) => {
      const next = { ...prev };
      if (value.trim().length === 0) {
        delete next[token];
      } else {
        next[token] = value.trim();
      }
      return next;
    });
  };

  const resetTheme = () => setTheme({});
  const resetI18n = () => setI18n({});

  const dirty =
    JSON.stringify(i18n) !== JSON.stringify(settings.i18nOverrides ?? {}) ||
    JSON.stringify(theme) !== JSON.stringify(settings.themeOverrides ?? {});

  const filtered = filter.trim().toLowerCase();

  return (
    <AdminShell title="Contenuti & Tema">
      <p className="text-surface-dark-foreground/70 max-w-prose mb-8 text-sm">
        Modifica le etichette del sito (italiano e inglese) e i colori globali.
        Lascia vuoto un campo per ripristinare il valore predefinito. Le modifiche
        diventano visibili a tutti gli utenti dopo il salvataggio.
      </p>

      {/* Save bar */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-8 bg-surface-dark/95 backdrop-blur border-b border-surface-dark-muted flex items-center justify-between gap-3 flex-wrap">
        <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
          {dirty ? "Modifiche non salvate" : "Tutto salvato"}
          {mutation.isError ? (
            <span className="ml-3 text-destructive">
              Errore: {(mutation.error as Error)?.message ?? "salvataggio fallito"}
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setI18n({ ...(settings.i18nOverrides ?? {}) });
              setTheme({ ...(settings.themeOverrides ?? {}) });
            }}
            disabled={!dirty || mutation.isPending}
            className="px-3 py-2 border border-surface-dark-muted font-display text-[11px] font-bold uppercase tracking-wider hover:border-background hover:text-background transition-colors disabled:opacity-40"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!dirty || mutation.isPending}
            className="px-4 py-2 bg-background text-foreground font-display text-[11px] font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40"
          >
            {mutation.isPending ? "Salvataggio…" : "Salva"}
          </button>
        </div>
      </div>

      {/* Theme palette */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-display text-xs sm:text-sm uppercase tracking-widest text-surface-dark-foreground/70">
            Tema · colori globali
          </h2>
          <button
            type="button"
            onClick={resetTheme}
            className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 hover:text-background"
          >
            Reset tema
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEME_TOKENS.map((tok) => {
            const value = theme[tok.key] ?? "";
            const isHex = /^#([0-9a-f]{3,8})$/i.test(value);
            return (
              <div
                key={tok.key}
                className="bg-surface-dark-muted/30 border border-surface-dark-muted p-4 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 mb-1">
                    {tok.label}
                  </div>
                  <div className="font-mono text-[9px] text-surface-dark-foreground/40 mb-2 truncate">
                    {tok.key}
                  </div>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onThemeChange(tok.key, e.target.value)}
                    placeholder="es. #2563eb oppure oklch(...)"
                    className="w-full bg-surface-dark border border-surface-dark-muted px-2 py-1.5 font-mono text-xs text-background placeholder:text-surface-dark-foreground/30 focus:outline-none focus:border-background"
                  />
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {isHex ? (
                    <input
                      type="color"
                      value={value.length === 4 ? value : value.slice(0, 7)}
                      onChange={(e) => onThemeChange(tok.key, e.target.value)}
                      className="h-10 w-10 cursor-pointer border border-surface-dark-muted bg-transparent"
                      aria-label={`Picker ${tok.label}`}
                    />
                  ) : (
                    <div
                      className="h-10 w-10 border border-surface-dark-muted"
                      style={{ background: value || "transparent" }}
                      title={value || "non impostato"}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tag colours */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-display text-xs sm:text-sm uppercase tracking-widest text-surface-dark-foreground/70">
            Colore linea card · per tag
          </h2>
        </div>
        <p className="text-surface-dark-foreground/60 text-xs mb-4 max-w-prose">
          Ogni paper usa il colore del suo primo tag per la linea in alto nella card.
          Lascia vuoto per usare il colore predefinito.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tags.map((tag) => {
            const token = tagTokenName(tag);
            const fallback = defaultTagColor(tag);
            const value = theme[token] ?? "";
            const shown = value || fallback;
            const isHex = /^#([0-9a-f]{3,8})$/i.test(shown);
            return (
              <div
                key={tag}
                className="bg-surface-dark-muted/30 border border-surface-dark-muted p-4 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 mb-1">
                    #{tag}
                  </div>
                  <div className="font-mono text-[9px] text-surface-dark-foreground/40 mb-2 truncate">
                    {token}
                  </div>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => onThemeChange(token, e.target.value)}
                    placeholder={fallback}
                    className="w-full bg-surface-dark border border-surface-dark-muted px-2 py-1.5 font-mono text-xs text-background placeholder:text-surface-dark-foreground/30 focus:outline-none focus:border-background"
                  />
                </div>
                <div className="shrink-0">
                  {isHex ? (
                    <input
                      type="color"
                      value={shown.length === 4 ? shown : shown.slice(0, 7)}
                      onChange={(e) => onThemeChange(token, e.target.value)}
                      className="h-10 w-10 cursor-pointer border border-surface-dark-muted bg-transparent"
                      aria-label={`Colore tag ${tag}`}
                    />
                  ) : (
                    <div
                      className="h-10 w-10 border border-surface-dark-muted"
                      style={{ background: shown }}
                    />
                  )}
                </div>
              </div>
            );
          })}
          {tags.length === 0 ? (
            <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/50">
              Nessun tag trovato
            </div>
          ) : null}
        </div>
      </section>

      {/* i18n overrides */}
      <section>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-display text-xs sm:text-sm uppercase tracking-widest text-surface-dark-foreground/70">
            Etichette del sito · IT / EN
          </h2>
          <button
            type="button"
            onClick={resetI18n}
            className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 hover:text-background"
          >
            Reset tutte
          </button>
        </div>

        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtra per chiave o testo…"
          className="w-full mb-6 bg-surface-dark border border-surface-dark-muted px-3 py-2 font-mono text-xs text-background placeholder:text-surface-dark-foreground/30 focus:outline-none focus:border-background"
        />

        <div className="space-y-8">
          {groups.map(([section, keys]) => {
            const visible = keys.filter((k) => {
              if (!filtered) return true;
              if (k.toLowerCase().includes(filtered)) return true;
              const it = getDefaultString("it", k) ?? "";
              const en = getDefaultString("en", k) ?? "";
              return (
                it.toLowerCase().includes(filtered) ||
                en.toLowerCase().includes(filtered)
              );
            });
            if (visible.length === 0) return null;

            return (
              <div key={section} className="border border-surface-dark-muted bg-surface-dark-muted/20">
                <div className="px-4 py-3 border-b border-surface-dark-muted bg-surface-dark-muted/40">
                  <h3 className="font-display text-[11px] uppercase tracking-widest text-background">
                    {SECTION_LABELS[section] ?? section}
                  </h3>
                </div>
                <div className="divide-y divide-surface-dark-muted">
                  {visible.map((key) => {
                    const defIt = getDefaultString("it", key);
                    const defEn = getDefaultString("en", key);
                    if (defIt === null && defEn === null) {
                      // formatter — skip (not user-editable text)
                      return null;
                    }
                    const ov = i18n[key] ?? {};
                    return (
                      <div key={key} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2 font-mono text-[10px] text-surface-dark-foreground/40 break-all">
                          {key}
                        </div>
                        <label className="block">
                          <span className="block font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 mb-1">
                            IT
                          </span>
                          <textarea
                            rows={defIt && defIt.length > 60 ? 3 : 1}
                            value={ov.it ?? ""}
                            onChange={(e) => onTextChange(key, "it", e.target.value)}
                            placeholder={defIt ?? ""}
                            className="w-full bg-surface-dark border border-surface-dark-muted px-2 py-1.5 font-serif text-sm text-background placeholder:text-surface-dark-foreground/30 focus:outline-none focus:border-background resize-y"
                          />
                        </label>
                        <label className="block">
                          <span className="block font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 mb-1">
                            EN
                          </span>
                          <textarea
                            rows={defEn && defEn.length > 60 ? 3 : 1}
                            value={ov.en ?? ""}
                            onChange={(e) => onTextChange(key, "en", e.target.value)}
                            placeholder={defEn ?? ""}
                            className="w-full bg-surface-dark border border-surface-dark-muted px-2 py-1.5 font-serif text-sm text-background placeholder:text-surface-dark-foreground/30 focus:outline-none focus:border-background resize-y"
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}
