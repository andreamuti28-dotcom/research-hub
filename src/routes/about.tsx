import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import portrait from "@/assets/portrait.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { siteSettingsQuery } from "@/hooks/use-site-settings";
import { useTranslated } from "@/hooks/use-translated";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Me — Andrea Muti" },
      {
        name: "description",
        content:
          "Chi sono: formazione, lingue, software & AI e certificazioni.",
      },
      { property: "og:title", content: "About Me — Andrea Muti" },
      {
        property: "og:description",
        content: "Formazione, lingue, software e certificazioni di Andrea Muti.",
      },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(siteSettingsQuery),
  component: AboutPage,
});

function AboutPage() {
  const { data: settings } = useSuspenseQuery(siteSettingsQuery);
  const [bio, role, kicker, eduLabel, langLabel, softLabel, certLabel] = useTranslated([
    settings.aboutBio,
    settings.aboutRole,
    settings.aboutKicker,
    settings.aboutEducationLabel,
    settings.aboutLanguagesLabel,
    settings.aboutSoftwareLabel,
    settings.aboutCertificationsLabel,
  ]);
  const portraitSrc = settings.portraitUrl ?? portrait;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Top: portrait + bio */}
      <section className="bg-background py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[320px_1fr] gap-10 md:gap-16 items-start">
          <div className="flex justify-center md:justify-start">
            <img
              src={portraitSrc}
              alt={`Ritratto di ${settings.name}`}
              className="w-64 h-64 md:w-72 md:h-72 rounded-full object-cover bg-surface"
            />
          </div>
          <div className="animate-fade-up">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              {kicker}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter italic mb-3">
              {settings.name}
            </h1>
            <p className="text-muted-foreground text-lg mb-6">{role}</p>
            <div className="max-w-[60ch] text-base md:text-lg leading-relaxed text-pretty space-y-4">
              {bio.split(/\n\n+/).map((para, i) => (
                <p key={i} className="whitespace-pre-line">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Skills band (color editable from admin) — 4 columns */}
      <section
        className="py-16 md:py-24"
        style={{ backgroundColor: settings.aboutPanelBg, color: settings.aboutPanelFg }}
      >
        <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">
          {/* Formazione */}
          <PanelColumn title={eduLabel} fg={settings.aboutPanelFg}>
            <ul className="space-y-5">
              {settings.aboutEducation.map((e, i) => (
                <li key={i}>
                  <div className="font-display text-sm font-bold leading-snug">
                    {e.name}
                  </div>
                  {e.detail && (
                    <div className="font-mono text-[11px] opacity-80 mt-1 leading-relaxed">
                      {e.detail}
                    </div>
                  )}
                </li>
              ))}
              {settings.aboutEducation.length === 0 && (
                <li className="font-mono text-xs opacity-70">—</li>
              )}
            </ul>
          </PanelColumn>

          {/* Lingue */}
          <PanelColumn title={langLabel} fg={settings.aboutPanelFg}>
            <ul className="space-y-5">
              {settings.aboutLanguages.map((l, i) => (
                <li key={i} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {l.flag && (
                        <span className="text-lg leading-none shrink-0" aria-hidden>
                          {l.flag}
                        </span>
                      )}
                      <span className="font-display text-xs font-bold uppercase tracking-widest truncate">
                        {l.name}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold tabular-nums shrink-0">
                      {l.level}%
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: settings.aboutPanelFg, opacity: 0.2 }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${l.level}%`,
                        backgroundColor: settings.aboutLanguagesBarColor,
                      }}
                    />
                  </div>
                </li>
              ))}
              {settings.aboutLanguages.length === 0 && (
                <li className="font-mono text-xs opacity-70">—</li>
              )}
            </ul>
          </PanelColumn>

          {/* Software & AI */}
          <PanelColumn title={softLabel} fg={settings.aboutPanelFg}>
            <div className="grid grid-cols-3 gap-x-3 gap-y-5">
              {settings.aboutSoftware.map((s, i) => (
                <LogoTile key={i} item={s} fg={settings.aboutPanelFg} />
              ))}
              {settings.aboutSoftware.length === 0 && (
                <div className="font-mono text-xs opacity-70 col-span-3">—</div>
              )}
            </div>
          </PanelColumn>

          {/* Certificazioni */}
          <PanelColumn title={certLabel} fg={settings.aboutPanelFg}>
            <div className="grid grid-cols-3 gap-x-3 gap-y-5">
              {settings.aboutCertifications.map((c, i) => (
                <LogoTile key={i} item={c} fg={settings.aboutPanelFg} />
              ))}
              {settings.aboutCertifications.length === 0 && (
                <div className="font-mono text-xs opacity-70 col-span-3">—</div>
              )}
            </div>
          </PanelColumn>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function PanelColumn({
  title,
  fg,
  children,
}: {
  title: string;
  fg: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold tracking-tight mb-2">{title}</h2>
      <div className="w-12 h-px opacity-60 mb-8" style={{ backgroundColor: fg }} />
      {children}
    </div>
  );
}

function LogoTile({
  item,
  fg,
}: {
  item: { name: string; logoUrl: string | null };
  fg: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="w-16 h-16 rounded-md bg-white/95 flex items-center justify-center overflow-hidden border"
        style={{ borderColor: fg, borderOpacity: 0.2 } as React.CSSProperties}
      >
        {item.logoUrl ? (
          <img
            src={item.logoUrl}
            alt={item.name}
            className="w-full h-full object-contain p-2"
            loading="lazy"
          />
        ) : (
          <span className="font-display text-base font-bold text-neutral-700">
            {item.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-[10px] font-bold uppercase tracking-widest leading-tight">
        {item.name}
      </div>
    </div>
  );
}
