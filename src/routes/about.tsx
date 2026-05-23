import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import portrait from "@/assets/portrait.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { siteSettingsQuery } from "@/hooks/use-site-settings";
import { useTranslated } from "@/hooks/use-translated";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SiteSettings, LanguageItem } from "@/lib/site-settings.functions";

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

const EMOJI_FONT =
  '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla","EmojiOne Color","Android Emoji",sans-serif';

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
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex flex-col">
        <SiteHeader />

        <section className="bg-background py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[320px_1fr] gap-10 md:gap-16 items-start">
            <div className="flex flex-col items-center md:items-start gap-4">
              <img
                src={portraitSrc}
                alt={`Ritratto di ${settings.name}`}
                className="w-64 h-64 md:w-72 md:h-72 rounded-full object-cover bg-surface"
                style={{
                  objectPosition: `${settings.aboutPortraitPosX}% ${settings.aboutPortraitPosY}%`,
                }}
              />
              {settings.linkedinUrl && (
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-foreground text-background hover:bg-primary transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                    aria-hidden
                  >
                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
                  </svg>
                </a>
              )}
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

        <section
          className="py-16 md:py-24"
          style={{ backgroundColor: settings.aboutPanelBg, color: settings.aboutPanelFg }}
        >
          <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">
            <PanelColumn title={eduLabel} fg={settings.aboutPanelFg}>
              <ul className="space-y-5">
                {settings.aboutEducation.map((e, i) => (
                  <TooltipItem key={i} description={e.description} settings={settings}>
                    <div>
                      <div className="font-display text-sm font-bold leading-snug">
                        {e.name}
                      </div>
                      {e.detail && (
                        <div className="font-mono text-[11px] opacity-80 mt-1 leading-relaxed">
                          {e.detail}
                        </div>
                      )}
                    </div>
                  </TooltipItem>
                ))}
                {settings.aboutEducation.length === 0 && (
                  <li className="font-mono text-xs opacity-70">—</li>
                )}
              </ul>
            </PanelColumn>

            <PanelColumn title={langLabel} fg={settings.aboutPanelFg}>
              <ul className="space-y-5">
                {settings.aboutLanguages.map((l, i) => (
                  <TooltipItem key={i} description={l.description} settings={settings}>
                    <LanguageRow item={l} settings={settings} />
                  </TooltipItem>
                ))}
                {settings.aboutLanguages.length === 0 && (
                  <li className="font-mono text-xs opacity-70">—</li>
                )}
              </ul>
            </PanelColumn>

            <PanelColumn title={softLabel} fg={settings.aboutPanelFg}>
              <ul className="space-y-4">
                {settings.aboutSoftware.map((s, i) => (
                  <TooltipItem key={i} description={s.description} settings={settings}>
                    <LogoRow item={s} maxWidth={settings.aboutLogoMaxWidth} />
                  </TooltipItem>
                ))}
                {settings.aboutSoftware.length === 0 && (
                  <li className="font-mono text-xs opacity-70">—</li>
                )}
              </ul>
            </PanelColumn>

            <PanelColumn title={certLabel} fg={settings.aboutPanelFg}>
              <ul className="space-y-4">
                {settings.aboutCertifications.map((c, i) => (
                  <TooltipItem key={i} description={c.description} settings={settings}>
                    <LogoRow item={c} maxWidth={settings.aboutLogoMaxWidth} />
                  </TooltipItem>
                ))}
                {settings.aboutCertifications.length === 0 && (
                  <li className="font-mono text-xs opacity-70">—</li>
                )}
              </ul>
            </PanelColumn>
          </div>
        </section>

        <SiteFooter />
      </div>
    </TooltipProvider>
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

function TooltipItem({
  description,
  settings,
  children,
}: {
  description: string;
  settings: SiteSettings;
  children: React.ReactNode;
}) {
  if (!description || !description.trim()) {
    return <li>{children}</li>;
  }
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{children}</div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-xs px-3 py-2 rounded-md border shadow-md"
          style={{
            backgroundColor: settings.aboutTooltipBg,
            color: settings.aboutTooltipFg,
            borderColor: settings.aboutTooltipBorder,
          }}
        >
          {description}
        </TooltipContent>
      </Tooltip>
    </li>
  );
}

function LanguageRow({ item, settings }: { item: LanguageItem; settings: SiteSettings }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {item.flagUrl ? (
            <img
              src={item.flagUrl}
              alt=""
              className="w-6 h-4 object-cover rounded-sm shrink-0"
              loading="lazy"
            />
          ) : item.flag ? (
            <span
              className="text-xl leading-none shrink-0"
              style={{ fontFamily: EMOJI_FONT }}
              aria-hidden
            >
              {item.flag}
            </span>
          ) : null}
          <span className="font-display text-xs font-bold uppercase tracking-widest truncate">
            {item.name}
          </span>
        </div>
        <span className="font-mono text-[11px] font-bold tabular-nums shrink-0">
          {item.level}%
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: settings.aboutLanguagesBarTrackColor }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${item.level}%`,
            backgroundColor: settings.aboutLanguagesBarColor,
          }}
        />
      </div>
    </div>
  );
}

function LogoRow({
  item,
  maxWidth,
}: {
  item: { name: string; logoUrl: string | null };
  maxWidth: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="about-logo shrink-0 aspect-square flex items-center justify-center overflow-hidden"
        style={{ maxWidth: `${maxWidth}px`, width: `${maxWidth}px` }}
      >
        {item.logoUrl ? (
          <img
            src={item.logoUrl}
            alt={item.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <span className="font-display text-xs font-bold opacity-70">
            {item.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="font-display text-sm font-bold leading-snug">
        {item.name}
      </div>
    </div>
  );
}
