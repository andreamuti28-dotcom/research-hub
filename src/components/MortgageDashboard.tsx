import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Landmark,
  Settings2,
  TrendingUp,
  Scale,
  ClipboardList,
  Percent,
  Wallet,
  PiggyBank,
  Flag,
  RefreshCcw,
} from "lucide-react";

/* ---------------------------------------------------------
   FINANCIAL ENGINE
--------------------------------------------------------- */
function monthlyPayment(principal: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 100 / 12;
  if (months <= 0) return 0;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

type ScheduleRow = { month: number; payment: number; interest: number; capital: number; balance: number };

function buildSchedule(principal: number, annualRatePct: number, months: number): { payment: number; rows: ScheduleRow[] } {
  const payment = monthlyPayment(principal, annualRatePct, months);
  let balance = principal;
  const rows: ScheduleRow[] = [];
  const r = annualRatePct / 100 / 12;
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const capital = Math.min(payment - interest, balance);
    balance = Math.max(0, balance - capital);
    rows.push({ month: m, payment, interest, capital, balance });
  }
  return { payment, rows };
}

function totalCostWithHike(
  principal: number,
  baseRatePct: number,
  bumpedRatePct: number,
  totalMonths: number,
  hikeMonth: number,
): number {
  const clampedHike = Math.max(0, Math.min(hikeMonth, totalMonths));
  const basePayment = monthlyPayment(principal, baseRatePct, totalMonths);
  const rBase = baseRatePct / 100 / 12;
  let balance = principal;
  let paid = 0;
  for (let m = 1; m <= clampedHike; m++) {
    const interest = balance * rBase;
    const capital = Math.min(basePayment - interest, balance);
    balance = Math.max(0, balance - capital);
    paid += basePayment;
  }
  const remaining = totalMonths - clampedHike;
  if (remaining <= 0) return paid;
  const newPayment = monthlyPayment(balance, bumpedRatePct, remaining);
  paid += newPayment * remaining;
  return paid;
}

const eur = (v: number) =>
  "€" + Math.round(v).toLocaleString("it-IT", { maximumFractionDigits: 0 });

const BCE_SCENARIOS = [
  { key: "cut", label: "−25 bps (taglio)", bps: -25 },
  { key: "base", label: "Base (invariato)", bps: 0 },
  { key: "h25", label: "+25 bps (1 rialzo)", bps: 25 },
  { key: "h50", label: "+50 bps (2 rialzi)", bps: 50 },
  { key: "h100", label: "+100 bps (4 rialzi)", bps: 100 },
  { key: "h150", label: "+150 bps (6 rialzi)", bps: 150 },
] as const;

const HIKE_LINES = [
  { bps: 50, color: "#fbbf24", label: "+50 bps" },
  { bps: 100, color: "#fb923c", label: "+100 bps" },
  { bps: 150, color: "#fb7185", label: "+150 bps" },
] as const;

/* ---------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------- */
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={
        "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " +
        className
      }
    >
      {children}
    </div>
  );
}

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

function SectionTitle({ icon: Icon, children }: { icon: IconType; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
      <h3 className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-400">
        {children}
      </h3>
    </div>
  );
}

type Accent = "violet" | "cyan" | "amber";

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = "",
  accent = "violet",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
  accent?: Accent;
}) {
  const accentClass =
    accent === "cyan" ? "accent-cyan-400" : accent === "amber" ? "accent-amber-400" : "accent-violet-400";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-0.5 text-right text-sm font-semibold text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-violet-400"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"w-full h-1.5 rounded-full bg-slate-800 " + accentClass}
      />
      {suffix && <span className="text-[11px] text-slate-500 -mt-1">{suffix}</span>}
    </div>
  );
}

function ChartCard({
  icon,
  title,
  children,
  height = 260,
}: {
  icon: IconType;
  title: string;
  children: React.ReactElement;
  height?: number;
}) {
  return (
    <Card>
      <SectionTitle icon={icon}>{title}</SectionTitle>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "#0b0f17",
    border: "1px solid #232a3b",
    borderRadius: 10,
    fontSize: 12,
    color: "#e6e9f0",
  },
  labelStyle: { color: "#94a3b8", marginBottom: 4 },
};

/* ---------------------------------------------------------
   MAIN DASHBOARD
--------------------------------------------------------- */
export default function MortgageDashboard() {
  const [capitale, setCapitale] = useState(200000);
  const [durata, setDurata] = useState(20);
  const [tanFisso, setTanFisso] = useState(3.25);
  const [tanVariabileBase, setTanVariabileBase] = useState(2.55);
  const [scenario, setScenario] = useState<(typeof BCE_SCENARIOS)[number]["key"]>("base");
  const [tableFilter, setTableFilter] = useState<"fisso" | "variabile">("fisso");
  const [tableMonths, setTableMonths] = useState(24);

  const [euribor3m, setEuribor3m] = useState(2.239);
  const [irs20y, setIrs20y] = useState(3.26);
  const [bceRate, setBceRate] = useState(2.0);

  const scenarioBps = BCE_SCENARIOS.find((s) => s.key === scenario)?.bps ?? 0;
  const tanVariabile = tanVariabileBase + scenarioBps / 100;
  const months = durata * 12;

  const { payment: rataFisso, rows: schedFisso } = useMemo(
    () => buildSchedule(capitale, tanFisso, months),
    [capitale, tanFisso, months],
  );
  const { payment: rataVariabile, rows: schedVariabile } = useMemo(
    () => buildSchedule(capitale, tanVariabile, months),
    [capitale, tanVariabile, months],
  );

  const risparmioMensile = rataFisso - rataVariabile;

  const totalInterestFisso = useMemo(() => schedFisso.reduce((a, r) => a + r.interest, 0), [schedFisso]);
  const totalInterestVariabile = useMemo(
    () => schedVariabile.reduce((a, r) => a + r.interest, 0),
    [schedVariabile],
  );
  const totalCostFisso = capitale + totalInterestFisso;
  const totalCostVariabileFlat = rataVariabile * months;

  const saldoAnnuale = useMemo(() => {
    const out = [{ anno: 0, fisso: capitale, variabile: capitale }];
    for (let y = 1; y <= durata; y++) {
      const idx = Math.min(y * 12, months) - 1;
      out.push({
        anno: y,
        fisso: schedFisso[idx]?.balance ?? 0,
        variabile: schedVariabile[idx]?.balance ?? 0,
      });
    }
    return out;
  }, [schedFisso, schedVariabile, capitale, durata, months]);

  const breakEvenData = useMemo(() => {
    const data: Array<Record<string, number>> = [];
    for (let y = 0; y <= durata; y++) {
      const hikeMonth = y * 12;
      const row: Record<string, number> = { anno: y, fisso: totalCostFisso, base: totalCostVariabileFlat };
      HIKE_LINES.forEach(({ bps }) => {
        row[`h${bps}`] = totalCostWithHike(
          capitale,
          tanVariabileBase,
          tanVariabileBase + bps / 100,
          months,
          hikeMonth,
        );
      });
      data.push(row);
    }
    return data;
  }, [capitale, tanVariabileBase, months, durata, totalCostFisso, totalCostVariabileFlat]);

  const breakEvenYear = useMemo(() => {
    const found = breakEvenData.find((row) => row.h100 <= totalCostFisso);
    return found ? found.anno : null;
  }, [breakEvenData, totalCostFisso]);

  const barCompareRata = [
    { name: `Fisso ${tanFisso.toFixed(2)}%`, value: rataFisso, fill: "#a78bfa" },
    { name: `Variabile ${tanVariabile.toFixed(2)}%`, value: rataVariabile, fill: "#22d3ee" },
  ];

  const distribData = [
    { name: "Capitale", Fisso: capitale, Variabile: capitale },
    { name: "Interessi", Fisso: totalInterestFisso, Variabile: totalInterestVariabile },
  ];

  const activeSchedule = tableFilter === "fisso" ? schedFisso : schedVariabile;

  const resetDefaults = () => {
    setCapitale(200000);
    setDurata(20);
    setTanFisso(3.25);
    setTanVariabileBase(2.55);
    setScenario("base");
  };

  const marketRefs: Array<[string, number, string, (v: number) => void, number]> = [
    ["Euribor 3M", euribor3m, "%", setEuribor3m, 0.001],
    ["IRS 20Y", irs20y, "%", setIrs20y, 0.01],
    ["BCE depo", bceRate, "%", setBceRate, 0.25],
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* HEADER */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/40 p-5 sm:p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5 text-violet-300" strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Mortgage Dashboard <span className="text-cyan-400">2026</span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Confronto tasso fisso vs variabile · simulazione interattiva, completamente modificabile
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {marketRefs.map(([label, val, unit, setter, step]) => (
                <label
                  key={label}
                  className="flex flex-col items-start gap-0.5 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2"
                >
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
                  <span className="flex items-baseline gap-1">
                    <input
                      type="number"
                      step={step}
                      value={val}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="w-14 bg-transparent text-sm font-semibold text-slate-100 tabular-nums focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">{unit}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* KPI ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Wallet className="w-3.5 h-3.5" /> RATA MENSILE — FISSO
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-violet-300 tabular-nums">{eur(rataFisso)}</div>
            <div className="text-xs text-slate-500 mt-1">
              TAN {tanFisso.toFixed(2)}% — {durata} anni
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Wallet className="w-3.5 h-3.5" /> RATA MENSILE — VARIABILE
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-300 tabular-nums">{eur(rataVariabile)}</div>
            <div className="text-xs text-slate-500 mt-1">
              TAN {tanVariabile.toFixed(2)}% ({scenarioBps >= 0 ? "+" : ""}
              {(scenarioBps / 100).toFixed(2)}%) — {durata} anni
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <PiggyBank className="w-3.5 h-3.5" /> RISPARMIO MENSILE VAR.
            </div>
            <div
              className={
                "text-2xl sm:text-3xl font-bold tabular-nums " +
                (risparmioMensile >= 0 ? "text-emerald-400" : "text-rose-400")
              }
            >
              {risparmioMensile >= 0 ? "€" : "-€"}
              {Math.abs(Math.round(risparmioMensile)).toLocaleString("it-IT")}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {eur(Math.abs(risparmioMensile) * months)} sull'intera durata
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <Flag className="w-3.5 h-3.5" /> BREAK-EVEN RIALZO +100BPS
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400">
              {breakEvenYear === null ? "—" : breakEvenYear === 0 ? "Subito" : `Anno ${breakEvenYear}`}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {breakEvenYear === null
                ? "Il fisso resta meno conveniente"
                : "Da qui il fisso diventa più conveniente"}
            </div>
          </Card>
        </div>

        {/* PARAMETERS */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Parametri mutuo</SectionTitle>
            <button
              onClick={resetDefaults}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Ripristina
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            <SliderField
              label="Capitale"
              value={capitale}
              min={20000}
              max={800000}
              step={5000}
              onChange={setCapitale}
              suffix="€ · finanziamento richiesto"
            />
            <SliderField label="Durata" value={durata} min={5} max={40} step={1} onChange={setDurata} suffix="anni" />
            <SliderField
              label="TAN Fisso"
              value={tanFisso}
              min={0.5}
              max={8}
              step={0.05}
              onChange={setTanFisso}
              suffix="% annuo"
            />
            <SliderField
              label="TAN Variabile (base)"
              value={tanVariabileBase}
              min={0.5}
              max={8}
              step={0.05}
              onChange={setTanVariabileBase}
              accent="cyan"
              suffix="% annuo, prima dello scenario BCE"
            />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
              Scenario BCE (applicato al variabile)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {BCE_SCENARIOS.map((s) => (
              <button
                key={s.key}
                onClick={() => setScenario(s.key)}
                className={
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors " +
                  (scenario === s.key
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                    : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600")
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </Card>

        {/* CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <ChartCard icon={Wallet} title="Confronto rata mensile">
            <BarChart data={barCompareRata} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => "€" + v.toLocaleString("it-IT")}
              />
              <Tooltip {...tooltipStyle} formatter={(v: number) => eur(v)} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={70} />
            </BarChart>
          </ChartCard>

          <ChartCard icon={TrendingUp} title="Saldo debito residuo">
            <LineChart data={saldoAnnuale} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="anno"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
                label={{ value: "Anni", position: "insideBottom", offset: -3, fill: "#64748b", fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => "€" + (v / 1000).toFixed(0) + "k"}
              />
              <Tooltip {...tooltipStyle} formatter={(v: number) => eur(v)} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              <Line type="monotone" dataKey="fisso" name="Fisso" stroke="#a78bfa" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="variabile" name="Variabile" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ChartCard>

          <div className="lg:col-span-2">
            <ChartCard icon={Scale} title="Distribuzione quota interessi / capitale">
              <BarChart data={distribData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => "€" + (v / 1000).toFixed(0) + "k"}
                />
                <Tooltip {...tooltipStyle} formatter={(v: number) => eur(v)} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Bar dataKey="Fisso" fill="#a78bfa" radius={[6, 6, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Variabile" fill="#22d3ee" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ChartCard>
          </div>
        </div>

        {/* AMORTIZATION TABLE */}
        <Card className="mt-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <SectionTitle icon={ClipboardList}>Piano di ammortamento</SectionTitle>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-slate-800 overflow-hidden">
                <button
                  onClick={() => setTableFilter("fisso")}
                  className={
                    "px-3 py-1.5 text-xs font-medium " +
                    (tableFilter === "fisso" ? "bg-violet-500/20 text-violet-200" : "text-slate-400")
                  }
                >
                  Fisso
                </button>
                <button
                  onClick={() => setTableFilter("variabile")}
                  className={
                    "px-3 py-1.5 text-xs font-medium " +
                    (tableFilter === "variabile" ? "bg-cyan-500/20 text-cyan-200" : "text-slate-400")
                  }
                >
                  Variabile
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400">
                Mesi visibili
                <input
                  type="number"
                  min={6}
                  max={months}
                  step={6}
                  value={tableMonths}
                  onChange={(e) => setTableMonths(Math.max(1, Math.min(months, Number(e.target.value))))}
                  className="w-16 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </label>
            </div>
          </div>

          <div className="overflow-auto max-h-96 rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-left text-slate-400">
                  <th className="px-3 py-2 font-medium">Mese</th>
                  <th className="px-3 py-2 font-medium text-right">Rata</th>
                  <th className="px-3 py-2 font-medium text-right">Interessi</th>
                  <th className="px-3 py-2 font-medium text-right">Capitale</th>
                  <th className="px-3 py-2 font-medium text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {activeSchedule.slice(0, tableMonths).map((row) => (
                  <tr key={row.month} className="border-t border-slate-800/70 tabular-nums text-slate-200">
                    <td className="px-3 py-1.5 text-slate-400">{row.month}</td>
                    <td className="px-3 py-1.5 text-right">{eur(row.payment)}</td>
                    <td className="px-3 py-1.5 text-right text-rose-300/90">{eur(row.interest)}</td>
                    <td className="px-3 py-1.5 text-right text-emerald-300/90">{eur(row.capital)}</td>
                    <td className="px-3 py-1.5 text-right">{eur(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">
          Dashboard Mutuo 2026 · Simulazione interattiva a scopo puramente illustrativo · Tutti i parametri e i dati di mercato sono modificabili
        </p>
      </div>
    </div>
  );
}
