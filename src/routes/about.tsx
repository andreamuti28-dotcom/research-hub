import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import portrait from "@/assets/portrait.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { siteSettingsQuery } from "@/hooks/use-site-settings";
import { useT } from "@/lib/i18n";
import { useTranslated } from "@/hooks/use-translated";
import { getHobbyIcon } from "@/lib/hobby-icons";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Me — Andrea Muti" },
      {
        name: "description",
        content:
          "Chi sono: ricercatore indipendente. Lingue parlate, software che uso e i miei hobby.",
      },
      { property: "og:title", content: "About Me — Andrea Muti" },
      {
        property: "og:description",
        content: "Lingue, software e hobby di Andrea Muti.",
      },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(siteSettingsQuery),
  component: AboutPage,
});

function AboutPage() {
  const { data: settings } = useSuspenseQuery(siteSettingsQuery);
  const t = useT();
  const [bio, role] = useTranslated([settings.aboutBio, settings.aboutRole]);
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
              {t("about.kicker")}
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

      {/* Yellow band: skills */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12 md:gap-10">
          {/* Languages */}
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
              {t("about.languages")}
            </h2>
            <div className="w-12 h-px bg-primary-foreground/60 mb-8" />
            <ul className="space-y-4">
              {settings.aboutLanguages.map((l, i) => (
                <li key={i} className="flex items-center gap-4">
                  <span className="font-display text-xs font-bold uppercase tracking-widest w-24 shrink-0">
                    {l.name}
                  </span>
                  <div className="flex-1 h-2 bg-primary-foreground/25 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-foreground rounded-full transition-all"
                      style={{ width: `${l.level}%` }}
                    />
                  </div>
                </li>
              ))}
              {settings.aboutLanguages.length === 0 && (
                <li className="font-mono text-xs opacity-70">—</li>
              )}
            </ul>
          </div>

          {/* Software */}
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
              {t("about.software")}
            </h2>
            <div className="w-12 h-px bg-primary-foreground/60 mb-8" />
            <div className="grid grid-cols-3 gap-x-2 gap-y-6">
              {settings.aboutSoftware.map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <SkillRing value={s.level} />
                  <div className="mt-2 font-display text-[10px] font-bold uppercase tracking-widest leading-tight">
                    {s.name}
                  </div>
                </div>
              ))}
              {settings.aboutSoftware.length === 0 && (
                <div className="font-mono text-xs opacity-70 col-span-3">—</div>
              )}
            </div>
          </div>

          {/* Hobbies */}
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
              {t("about.hobbies")}
            </h2>
            <div className="w-12 h-px bg-primary-foreground/60 mb-8" />
            <ul className="flex flex-col items-start gap-5">
              {settings.aboutHobbies.map((h, i) => {
                const Icon = getHobbyIcon(h.icon);
                return (
                  <li key={i} className="flex items-center gap-4">
                    <span className="w-14 h-14 rounded-full border-2 border-primary-foreground flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </span>
                    <span className="font-display text-xs font-bold uppercase tracking-widest">
                      {h.name}
                    </span>
                  </li>
                );
              })}
              {settings.aboutHobbies.length === 0 && (
                <li className="font-mono text-xs opacity-70">—</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SkillRing({ value }: { value: number }) {
  const size = 64;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-[11px] font-bold">
        {value}%
      </span>
    </div>
  );
}
