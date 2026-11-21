import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect, type ReactNode } from "react";
import portrait from "@/assets/portrait.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { siteSettingsQuery } from "@/hooks/use-site-settings";
import { useTranslated } from "@/hooks/use-translated";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SiteSettings, LanguageItem } from "@/lib/site-settings.functions";
import { useT } from "@/lib/i18n";
import { ogImageMeta } from "@/lib/og";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Dott. Andrea Muti" },
      {
        name: "description",
        content:
          "Chi sono: formazione, lingue e certificazioni di Andrea Muti, ricercatore indipendente in finanza e mercati.",
      },
      { property: "og:title", content: "Dott. Andrea Muti" },
      {
        property: "og:description",
        content: "Formazione, lingue e certificazioni di Andrea Muti.",
      },
      { property: "og:url", content: "https://www.andreamuti.com/about" },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Dott. Andrea Muti" },
      {
        name: "twitter:description",
        content: "Formazione, lingue e certificazioni di Andrea Muti.",
      },
      ...ogImageMeta(),
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/about" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQuery),
  component: AboutPage,
});

const EMOJI_FONT =
  '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla","EmojiOne Color","Android Emoji",sans-serif';

// Turns web addresses written in the bio (with or without https://) into
// clickable links that open in a new tab.
const LINK_RE =
  /(https?:\/\/[^\s]+[^\s.,;:!?)]|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:org|com|net|io|it|eu|ch|dev|app)\b(?:\/[^\s]*[^\s.,;:!?)])?)/gi;

// Also supports [testo](https://...) to link a word to an address.
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

function withLinks(text: string) {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(MD_LINK_RE)) {
    out.push(...bareLinks(text.slice(last, m.index), k++));
    out.push(
      <a
        key={`md-${k++}`}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 decoration-1 hover:text-primary"
      >
        {m[1]}
      </a>,
    );
    last = (m.index ?? 0) + m[0].length;
  }
  out.push(...bareLinks(text.slice(last), k++));
  return out;
}

function bareLinks(text: string, group: number): ReactNode[] {
  const parts = text.split(LINK_RE);
  return parts.map((part, i) => {
    if (i % 2 === 0) return part;
    const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;
    return (
      <a
        key={`${group}-${i}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 decoration-1 hover:text-primary"
      >
        {part}
      </a>
    );
  });
}

const ROLES = [
  { key: "role1", icon: "users" },
  { key: "role2", icon: "trophy" },
  { key: "role3", icon: "landmark" },
  { key: "role4", icon: "pen" },
] as const;

function RoleIcon({ name }: { name: (typeof ROLES)[number]["icon"] }) {
  const common = {
    width: 44,
    height: 44,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--gold)",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "users")
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M16 14.6c2.6.2 4.6 1.9 5.3 4.9" />
      </svg>
    );
  if (name === "trophy")
    return (
      <svg {...common}>
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
        <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" />
        <path d="M12 13v4M8.5 20h7M10 17h4" />
      </svg>
    );
  if (name === "landmark")
    return (
      <svg {...common}>
        <path d="M3 9.5 12 4l9 5.5" />
        <path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7" />
        <path d="M3 20h18" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

function AboutPage() {
  const { data: settings } = useSuspenseQuery(siteSettingsQuery);
  const t = useT();
  const baseLabels = [
    settings.aboutBio,
    settings.aboutRole,
    settings.aboutKicker,
    settings.aboutEducationLabel,
    settings.aboutLanguagesLabel,
    settings.aboutCertificationsLabel,
  ];
  const panelFlat = [
    ...settings.aboutEducation.flatMap((e) => [e.name, e.detail ?? "", e.description ?? ""]),
    ...settings.aboutLanguages.flatMap((l) => [l.name, "", l.description ?? ""]),
    ...settings.aboutCertifications.flatMap((c) => [c.name, "", c.description ?? ""]),
  ];
  const all = useTranslated([...baseLabels, ...panelFlat]);
  const [bio, role, kicker, eduLabel, langLabel, certLabel] = all;
  let cursor = baseLabels.length;
  const take = (n: number) => {
    const slice = all.slice(cursor, cursor + n);
    cursor += n;
    return slice;
  };
  const trEducation = settings.aboutEducation.map((e) => {
    const [name, detail, description] = take(3);
    return { ...e, name, detail: e.detail ? detail : e.detail, description };
  });
  const trLanguages = settings.aboutLanguages.map((l) => {
    const [name, , description] = take(3);
    return { ...l, name, description };
  });
  const trCertifications = settings.aboutCertifications.map((c) => {
    const [name, , description] = take(3);
    return { ...c, name, description };
  });
  const portraitSrc = settings.portraitUrl ?? portrait;
  const tk = t as unknown as (k: string) => string;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex flex-col">
        <SiteHeader />

        {/* ---------- Hero ---------- */}
        <section className="bg-brand text-brand-fg">
          <div className="max-w-[1240px] mx-auto px-6 sm:px-8 pt-10 pb-12 md:pt-12 md:pb-14 flex flex-wrap gap-8 md:gap-10 items-start">
            <div className="flex-[0_1_250px] min-w-[200px]">
              <img
                src={portraitSrc}
                alt={t("about.portraitAlt", settings.name)}
                className="am-fadein am-d1 w-full aspect-[4/5] object-cover rounded-2xl border border-brand-line bg-brand-2"
                style={{
                  objectPosition: `${settings.aboutPortraitPosX}% ${settings.aboutPortraitPosY}%`,
                }}
              />
              {settings.linkedinUrl && (
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="am-btn am-in am-d4 mt-5 inline-flex items-center gap-2.5 h-11 px-5 rounded-md bg-gold text-[#14171c] font-display text-sm font-bold"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                    aria-hidden
                  >
                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
                  </svg>
                  {t("common.linkedin")}
                </a>
              )}
            </div>
            <div className="flex-[999_1_520px] min-w-0">
              <p className="am-in text-[13px] font-semibold uppercase tracking-[0.1em] text-gold font-display">
                {kicker}
              </p>
              <h1 className="am-in am-d1 mt-3.5 font-editorial font-medium text-4xl sm:text-[46px] leading-[1.02]">
                {settings.name}
              </h1>
              <p className="am-in am-d2 mt-3.5 font-editorial italic text-xl text-[#e6eeea]">
                {role}
              </p>
              <div className="am-in am-d3 mt-6 max-w-[680px] space-y-4 text-[15.5px] leading-[1.7] text-brand-muted font-display text-pretty">
                {bio.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {withLinks(para)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-sage">
          {/* ---------- Roles ---------- */}
          <div className="max-w-[1240px] mx-auto px-6 sm:px-8 pt-12 pb-10">
            <h2 className="am-reveal font-editorial font-medium text-[30px] leading-tight">
              {t("about.rolesTitle")}
            </h2>
            <div className="am-stagger grid gap-5 mt-8 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
              {ROLES.map((r) => {
                const isForbes = r.key === "role4";
                const logo = isForbes ? settings.heroLogoLightUrl : null;
                const inner = (
                  <>
                    <div className="h-[150px] overflow-hidden">
                      <div
                        className={`am-img h-full flex items-center justify-center ${
                          logo ? "bg-white" : "bg-brand"
                        }`}
                        style={
                          logo
                            ? undefined
                            : {
                                backgroundImage:
                                  "radial-gradient(circle at 20% 20%, rgb(226 196 106 / 0.18), transparent 55%), radial-gradient(circle at 85% 90%, rgb(140 201 173 / 0.18), transparent 50%)",
                              }
                        }
                      >
                        {logo ? (
                          <img
                            src={logo}
                            alt={tk(`about.${r.key}.org`)}
                            className="max-h-24 max-w-[80%] object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <RoleIcon name={r.icon} />
                        )}
                      </div>
                    </div>
                    <div className="p-6 pt-5">
                      <p className="text-[13px] font-semibold text-primary font-display">
                        {tk(`about.${r.key}.role`)}
                      </p>
                      <h3 className="mt-1.5 font-editorial text-[18px] font-medium leading-tight">
                        {tk(`about.${r.key}.org`)}
                      </h3>
                      <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground font-display">
                        {tk(`about.${r.key}.desc`)}
                      </p>
                    </div>
                  </>
                );
                return isForbes && settings.forbesUrl ? (
                  <a
                    key={r.key}
                    href={settings.forbesUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="am-card am-lift block bg-background text-foreground rounded-2xl overflow-hidden"
                  >
                    {inner}
                  </a>
                ) : (
                  <article
                    key={r.key}
                    className="am-card am-lift bg-background rounded-2xl overflow-hidden"
                  >
                    {inner}
                  </article>
                );
              })}
            </div>
          </div>

          {/* ---------- Education, languages, certifications ---------- */}
          <div className="am-stagger max-w-[1240px] mx-auto px-6 sm:px-8 pt-10 pb-14 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))] items-start">
            <div className="bg-background rounded-2xl p-6">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-primary font-display mb-2">
                {eduLabel}
              </h2>
              <ul>
                {trEducation.map((e, i) => (
                  <TooltipItem key={i} description={e.description} settings={settings}>
                    <div className="am-row flex gap-4 items-center py-3.5 border-b border-border">
                      <div className="am-logo shrink-0 w-[52px] h-[52px] rounded-xl bg-white border border-sage-line flex items-center justify-center overflow-hidden p-1.5">
                        {e.logoUrl ? (
                          <img
                            src={e.logoUrl}
                            alt=""
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="font-editorial text-base font-semibold text-brand">
                            {e.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 font-display">
                        <p className="text-[15px] font-semibold leading-snug">{e.name}</p>
                        {e.detail && (
                          <p className="mt-0.5 text-sm text-muted-foreground">{e.detail}</p>
                        )}
                      </div>
                    </div>
                  </TooltipItem>
                ))}
                {settings.aboutEducation.length === 0 && (
                  <li className="text-sm text-muted-foreground">{t("common.notAvailable")}</li>
                )}
              </ul>
            </div>

            <div className="bg-background rounded-2xl p-6">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-primary font-display mb-2">
                {langLabel}
              </h2>
              <ul>
                {trLanguages.map((l, i) => (
                  <TooltipItem key={i} description={l.description} settings={settings}>
                    <LanguageRow item={l} />
                  </TooltipItem>
                ))}
                {settings.aboutLanguages.length === 0 && (
                  <li className="text-sm text-muted-foreground">{t("common.notAvailable")}</li>
                )}
              </ul>
            </div>

            <div className="bg-background rounded-2xl p-6">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-primary font-display mb-4">
                {certLabel}
              </h2>
              <ul className="grid grid-cols-3 gap-3">
                {trCertifications.map((c, i) => (
                  <TooltipItem key={i} description={c.description} settings={settings}>
                    <div className="am-tile h-full flex flex-col items-center gap-2 text-center py-3.5 px-1.5 rounded-xl border border-border">
                      <div className="am-logo w-[52px] h-[52px] rounded-xl bg-white flex items-center justify-center overflow-hidden p-1">
                        {c.logoUrl ? (
                          <img
                            src={c.logoUrl}
                            alt=""
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="font-editorial text-sm font-semibold text-brand">
                            {c.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs leading-snug font-display">{c.name}</span>
                    </div>
                  </TooltipItem>
                ))}
                {settings.aboutCertifications.length === 0 && (
                  <li className="col-span-3 text-sm text-muted-foreground">
                    {t("common.notAvailable")}
                  </li>
                )}
              </ul>
            </div>
          </div>

          {settings.contactEmail && (
            <div className="max-w-[1240px] mx-auto px-6 sm:px-8 pb-14">
              <div className="am-reveal bg-brand text-brand-fg rounded-2xl p-8 flex flex-wrap justify-between items-center gap-5">
                <p className="font-editorial text-[21px] leading-snug">{t("about.cta.text")}</p>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="am-btn inline-flex items-center h-12 px-6 rounded-md bg-gold text-[#14171c] font-bold text-[15px] font-display"
                >
                  {t("about.cta.button")}
                </a>
              </div>
            </div>
          )}
        </section>

        <SiteFooter />
      </div>
    </TooltipProvider>
  );
}

function TooltipItem({
  description,
  settings,
  children,
}: {
  description: string;
  settings: SiteSettings;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const hasDescription = Boolean(description && description.trim());

  useEffect(() => {
    if (!open) return;
    const closeOnTouchOutside = (e: TouchEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("touchstart", closeOnTouchOutside);
    return () => document.removeEventListener("touchstart", closeOnTouchOutside);
  }, [open]);

  if (!hasDescription) {
    return <li>{children}</li>;
  }

  return (
    <li>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <div
            ref={triggerRef}
            className="cursor-help h-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            tabIndex={0}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onTouchStart={() => setOpen((v) => !v)}
          >
            {children}
          </div>
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

function LanguageRow({ item }: { item: LanguageItem }) {
  return (
    <div className="am-row py-4 border-b border-border font-display">
      <div className="flex items-center gap-3.5">
        {item.flagUrl ? (
          <img
            src={item.flagUrl}
            alt=""
            className="am-logo w-9 h-6 object-cover rounded-[3px] shrink-0"
            loading="lazy"
          />
        ) : item.flag ? (
          <span
            className="am-logo text-2xl leading-none shrink-0"
            style={{ fontFamily: EMOJI_FONT }}
            aria-hidden
          >
            {item.flag}
          </span>
        ) : null}
        <span className="flex-1 min-w-0 text-[15px] font-semibold truncate">{item.name}</span>
        <span className="text-sm text-muted-foreground tabular-nums">{item.level}%</span>
      </div>
      <div className="mt-2.5 h-1.5 rounded-full bg-sage overflow-hidden">
        <div
          className="am-bar h-full rounded-full bg-primary"
          style={{ width: `${item.level}%` }}
        />
      </div>
    </div>
  );
}
