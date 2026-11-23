import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { useTweened } from "@/hooks/use-motion";

const CAPITAL = 10_000;

/** A small, working preview of the compound-interest dashboard for the home page. */
export function InterestMini({
  href,
  className = "",
}: {
  href: string | null;
  className?: string;
}) {
  const t = useT();
  const locale = t("common.monthLocale");
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(20);
  const r = rate / 100;
  const simple = CAPITAL * (1 + r * years);
  const compound = CAPITAL * Math.pow(1 + r, years);
  const shownSimple = useTweened(simple);
  const shownCompound = useTweened(compound);
  const max = Math.max(simple, compound);
  const fmt = (v: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(v);
  const rateLabel = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(rate) + "%";

  return (
    <div className={`bg-background text-foreground rounded-2xl p-5 sm:p-6 ${className}`}>
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-primary font-display">
        {t("home.dash.try")}
      </p>
      <h3 className="mt-1.5 font-editorial text-[20px] font-medium leading-tight">
        {t("home.dash.miniTitle")}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4 font-display">
        <div>
          <label htmlFor="mini-rate" className="flex justify-between text-sm font-semibold">
            <span>{t("home.dash.rate")}</span>
            <span className="tabular-nums">{rateLabel}</span>
          </label>
          <input
            id="mini-rate"
            type="range"
            min={1}
            max={12}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full mt-3 accent-[var(--primary)]"
          />
        </div>
        <div>
          <label htmlFor="mini-years" className="flex justify-between text-sm font-semibold">
            <span>{t("home.dash.years")}</span>
            <span className="tabular-nums">{years}</span>
          </label>
          <input
            id="mini-years"
            type="range"
            min={1}
            max={40}
            step={1}
            value={years}
            onChange={(e) => setYears(parseInt(e.target.value, 10))}
            className="w-full mt-3 accent-[var(--primary)]"
          />
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground font-display">{t("home.dash.capital")}</p>
      <div className="mt-2.5 flex flex-col gap-3 font-display">
        {[
          {
            label: t("home.dash.simple"),
            value: shownSimple,
            target: simple,
            color: "bg-primary/40",
          },
          {
            label: t("home.dash.compound"),
            value: shownCompound,
            target: compound,
            color: "bg-primary",
          },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-sm">
              <span>{row.label}</span>
              <strong className="tabular-nums">{fmt(row.value)}</strong>
            </div>
            <div className="h-3 mt-1.5 rounded-full bg-sage overflow-hidden">
              <div
                className={`am-bar h-full rounded-full ${row.color}`}
                style={{ width: `${(row.target / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[15px] font-semibold text-primary font-display">
        {t("home.dash.gap", fmt(shownCompound - shownSimple))}
      </p>
      {href && (
        <Link
          to={href}
          className="inline-block mt-3 text-sm font-semibold text-primary font-display hover:underline underline-offset-4"
        >
          {t("home.dash.openFull")} <span className="am-arrow">→</span>
        </Link>
      )}
    </div>
  );
}
