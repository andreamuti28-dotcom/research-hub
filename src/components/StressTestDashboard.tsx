// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import {
  ShieldAlert, Settings2, TrendingDown, Table2, Layers, RefreshCcw, Gauge,
} from "lucide-react";

/* ---------------------------------------------------------
   MODELLO
   Il patrimonio è suddiviso in 4 classi di attivo. Ogni scenario
   di stress applica uno shock percentuale (editabile) a ciascuna
   classe. Il patrimonio netto = attivo totale rivalutato - debiti
   (i debiti sono trattati come nominalmente invarianti).
--------------------------------------------------------- */
const ASSET_CLASSES = [
  { key: "azioni", label: "Azioni", color: "#22d3ee" },
  { key: "obbligazioni", label: "Obbligazioni", color: "#a78bfa" },
  { key: "liquidita", label: "Liquidità", color: "#34d399" },
  { key: "immobiliare", label: "Immobiliare", color: "#fbbf24" },
];

const SCENARIOS = [
  { key: "crollo", label: "Crollo azionario −20%", short: "Crollo azionario", color: "#fb7185" },
  { key: "inflazione", label: "Inflazione elevata +5%", short: "Inflazione", color: "#f59e0b" },
  { key: "tassi", label: "Rialzo tassi +150bps", short: "Rialzo tassi", color: "#fb923c" },
  { key: "combinato", label: "Tempesta perfetta (combinato)", short: "Combinato", color: "#ef4444" },
];

const DEFAULT_SHOCKS = {
  crollo: { azioni: -20, obbligazioni: 3, liquidita: 0, immobiliare: -4 },
  inflazione: { azioni: -3, obbligazioni: -6, liquidita: -5, immobiliare: 2 },
  tassi: { azioni: -8, obbligazioni: -9, liquidita: 1, immobiliare: -6 },
  combinato: { azioni: -25, obbligazioni: -10, liquidita: -4, immobiliare: -12 },
};

const eur = (v) =>
  (v < 0 ? "-€" : "€") + Math.abs(Math.round(v)).toLocaleString("it-IT", { maximumFractionDigits: 0 });
const pct = (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "%";

/* ---------------------------------------------------------
   UI PRIMITIVES
--------------------------------------------------------- */
function Card({ children, className = "" }) {
  return (
    <div className={"rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " + className}>
      {children}
    </div>
  );
}
function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
      <h3 className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-400">{children}</h3>
    </div>
  );
}
function SliderField({ label, value, min, max, step, onChange, suffix = "", accent = "violet" }) {
  const accentClass =
    accent === "cyan" ? "accent-cyan-400" : accent === "amber" ? "accent-amber-400" : accent === "rose" ? "accent-rose-400" : "accent-violet-400";
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
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"w-full h-1.5 rounded-full bg-slate-800 " + accentClass}
      />
      {suffix && <span className="text-[11px] text-slate-500 -mt-1">{suffix}</span>}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { background: "#0b0f17", border: "1px solid #232a3b", borderRadius: 10, fontSize: 12, color: "#e6e9f0" },
  labelStyle: { color: "#94a3b8", marginBottom: 4 },
};

/* ---------------------------------------------------------
   MAIN DASHBOARD
--------------------------------------------------------- */
export default function PortfolioStressTest() {
  const [totaleAttivo, setTotaleAttivo] = useState(500000);
  const [debiti, setDebiti] = useState(150000);
  const [allocAzioni, setAllocAzioni] = useState(45);
  const [allocObbligazioni, setAllocObbligazioni] = useState(35);
  const [allocImmobiliare, setAllocImmobiliare] = useState(10);
  const allocLiquidita = Math.max(0, 100 - allocAzioni - allocObbligazioni - allocImmobiliare);

  const [tolleranza, setTolleranza] = useState(20);
  const [detailScenario, setDetailScenario] = useState("crollo");
  const [shocks, setShocks] = useState(DEFAULT_SHOCKS);

  const updateShock = (scenarioKey, assetKey, value) => {
    setShocks((prev) => ({
      ...prev,
      [scenarioKey]: { ...prev[scenarioKey], [assetKey]: value },
    }));
  };

  const resetDefaults = () => {
    setTotaleAttivo(500000);
    setDebiti(150000);
    setAllocAzioni(45);
    setAllocObbligazioni(35);
    setAllocImmobiliare(10);
    setTolleranza(20);
    setShocks(DEFAULT_SHOCKS);
  };

  const allocazioni = {
    azioni: allocAzioni, obbligazioni: allocObbligazioni, liquidita: allocLiquidita, immobiliare: allocImmobiliare,
  };

  const baselineValues = useMemo(() => {
    const out = {};
    ASSET_CLASSES.forEach((a) => (out[a.key] = totaleAttivo * (allocazioni[a.key] / 100)));
    return out;
  }, [totaleAttivo, allocAzioni, allocObbligazioni, allocImmobiliare]);

  const patrimonioNettoBase = totaleAttivo - debiti;

  const scenarioResults = useMemo(() => {
    return SCENARIOS.map((s) => {
      const values = {};
      ASSET_CLASSES.forEach((a) => {
        const shock = shocks[s.key][a.key] / 100;
        values[a.key] = baselineValues[a.key] * (1 + shock);
      });
      const totaleAttivoScenario = ASSET_CLASSES.reduce((sum, a) => sum + values[a.key], 0);
      const patrimonioNetto = totaleAttivoScenario - debiti;
      const perdita = patrimonioNetto - patrimonioNettoBase;
      const perditaPct = patrimonioNettoBase !== 0 ? (perdita / patrimonioNettoBase) * 100 : 0;
      return { ...s, values, totaleAttivoScenario, patrimonioNetto, perdita, perditaPct };
    });
  }, [baselineValues, debiti, shocks, patrimonioNettoBase]);

  const worst = useMemo(
    () => scenarioResults.reduce((a, b) => (b.patrimonioNetto < a.patrimonioNetto ? b : a), scenarioResults[0]),
    [scenarioResults]
  );

  const supersaTolleranza = worst.perditaPct < -tolleranza;

  const barBase = [
    { name: "Attuale", patrimonioNetto: patrimonioNettoBase, fill: "#34d399" },
    ...scenarioResults.map((s) => ({ name: s.short, patrimonioNetto: s.patrimonioNetto, fill: s.color })),
  ];

  const detail = scenarioResults.find((s) => s.key === detailScenario);
  const detailData = ASSET_CLASSES.map((a) => ({
    name: a.label,
    delta: detail.values[a.key] - baselineValues[a.key],
    baseline: baselineValues[a.key],
    dopo: detail.values[a.key],
  }));

  const bondCompensaCrollo = scenarioResults.find((s) => s.key === "crollo")?.values.obbligazioni - baselineValues.obbligazioni;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* HEADER */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-300" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Stress Test del Portafoglio</h1>
              <p className="text-sm text-slate-400 mt-1">
                Non quanto guadagni, ma quanto potresti perdere in scenari avversi — simulazione interattiva e modificabile
              </p>
            </div>
          </div>
        </div>

        {/* KPI ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">PATRIMONIO NETTO ATTUALE</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">{eur(patrimonioNettoBase)}</div>
            <div className="text-xs text-slate-500 mt-1">attivo {eur(totaleAttivo)} − debiti {eur(debiti)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">SCENARIO PEGGIORE</div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-400 tabular-nums">{pct(worst.perditaPct)}</div>
            <div className="text-xs text-slate-500 mt-1">{worst.label} · {eur(worst.perdita)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">OBBLIGAZIONI NEL CROLLO AZIONARIO</div>
            <div className={"text-2xl sm:text-3xl font-bold tabular-nums " + (bondCompensaCrollo >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {eur(bondCompensaCrollo)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {bondCompensaCrollo >= 0 ? "compensano parzialmente le perdite azionarie" : "non offrono protezione in questo scenario"}
            </div>
          </Card>
        </div>

        {/* RISK TOLERANCE BANNER */}
        <Card className={"mb-6 border " + (supersaTolleranza ? "border-rose-500/40 bg-rose-950/20" : "border-emerald-500/40 bg-emerald-950/20")}>
          <div className="flex items-start gap-3">
            <Gauge className={"w-5 h-5 mt-0.5 shrink-0 " + (supersaTolleranza ? "text-rose-400" : "text-emerald-400")} />
            <div>
              <div className="text-sm font-semibold text-slate-100">
                {supersaTolleranza
                  ? "La perdita nello scenario peggiore supera la tua tolleranza dichiarata"
                  : "La perdita nello scenario peggiore rientra nella tua tolleranza dichiarata"}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Hai indicato di poter accettare una perdita massima del {tolleranza}% senza vendere in preda al panico.
                Nello scenario "{worst.label}" il tuo patrimonio netto scenderebbe del {Math.abs(worst.perditaPct).toFixed(1)}%.
                {supersaTolleranza
                  ? " Vale la pena chiedersi se la tua tolleranza al rischio è reale o solo teorica."
                  : " La composizione attuale sembra coerente con la tolleranza dichiarata, almeno su questi scenari."}
              </p>
            </div>
          </div>
        </Card>

        {/* PARAMETERS */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Patrimonio e allocazione</SectionTitle>
            <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              <RefreshCcw className="w-3.5 h-3.5" /> Ripristina
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
            <SliderField label="Totale attivo (patrimonio lordo)" value={totaleAttivo} min={10000} max={3000000} step={5000} onChange={setTotaleAttivo} suffix="€" />
            <SliderField label="Debiti (es. mutuo residuo)" value={debiti} min={0} max={2000000} step={5000} onChange={setDebiti} suffix="€" />
            <SliderField label="Tolleranza al rischio dichiarata" value={tolleranza} min={5} max={60} step={1} onChange={setTolleranza} accent="rose" suffix="% di perdita massima accettabile" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-3">
            <SliderField label="Azioni" value={allocAzioni} min={0} max={100} step={1} onChange={setAllocAzioni} accent="cyan" suffix="% del patrimonio" />
            <SliderField label="Obbligazioni" value={allocObbligazioni} min={0} max={100} step={1} onChange={setAllocObbligazioni} suffix="% del patrimonio" />
            <SliderField label="Immobiliare" value={allocImmobiliare} min={0} max={100} step={1} onChange={setAllocImmobiliare} accent="amber" suffix="% del patrimonio" />
          </div>
          <div className="text-xs text-slate-500">
            Liquidità (calcolata automaticamente): <span className="text-slate-200 font-semibold">{allocLiquidita.toFixed(0)}%</span> — {eur(baselineValues.liquidita)}
          </div>
        </Card>

        {/* SCENARIO OVERVIEW CHART */}
        <Card className="mb-5">
          <SectionTitle icon={TrendingDown}>Patrimonio netto per scenario</SectionTitle>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barBase} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis width={70} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => "€" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip {...tooltipStyle} formatter={(v) => eur(v)} />
                <Bar dataKey="patrimonioNetto" radius={[8, 8, 0, 0]} maxBarSize={70}>
                  {barBase.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* DETAIL PER ASSET CLASS */}
        <Card className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <SectionTitle icon={Layers}>Impatto per classe di attivo</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setDetailScenario(s.key)}
                  className={
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors " +
                    (detailScenario === s.key ? "bg-rose-500/20 border-rose-400 text-rose-200" : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600")
                  }
                >
                  {s.short}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detailData} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis width={70} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => "€" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip {...tooltipStyle} formatter={(v) => eur(v)} labelFormatter={(n) => `Variazione — ${n}`} />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="delta" radius={[6, 6, 6, 6]} maxBarSize={60}>
                  {detailData.map((d, i) => <Cell key={i} fill={d.delta >= 0 ? "#34d399" : "#fb7185"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">Variazione in € rispetto al valore attuale nello scenario "{detail.label}". Le barre verdi compensano, quelle rosse trascinano il patrimonio verso il basso.</p>
        </Card>

        {/* RESULTS TABLE */}
        <Card className="mb-5">
          <SectionTitle icon={Table2}>Dettaglio per scenario</SectionTitle>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-400">
                  <th className="px-3 py-2 font-medium">Classe di attivo</th>
                  <th className="px-3 py-2 font-medium text-right">Attuale</th>
                  {SCENARIOS.map((s) => (
                    <th key={s.key} className="px-3 py-2 font-medium text-right">{s.short}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular-nums text-slate-200">
                {ASSET_CLASSES.map((a) => (
                  <tr key={a.key} className="border-t border-slate-800/70">
                    <td className="px-3 py-2 text-slate-400">{a.label}</td>
                    <td className="px-3 py-2 text-right">{eur(baselineValues[a.key])}</td>
                    {scenarioResults.map((s) => (
                      <td key={s.key} className="px-3 py-2 text-right">{eur(s.values[a.key])}</td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-slate-700 font-semibold">
                  <td className="px-3 py-2 text-slate-200">Patrimonio netto</td>
                  <td className="px-3 py-2 text-right text-emerald-300">{eur(patrimonioNettoBase)}</td>
                  {scenarioResults.map((s) => (
                    <td key={s.key} className="px-3 py-2 text-right" style={{ color: s.perdita < 0 ? "#fb7185" : "#34d399" }}>
                      {eur(s.patrimonioNetto)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-1.5 text-slate-500 text-xs">Variazione %</td>
                  <td className="px-3 py-1.5"></td>
                  {scenarioResults.map((s) => (
                    <td key={s.key} className="px-3 py-1.5 text-right text-xs" style={{ color: s.perdita < 0 ? "#fb7185" : "#34d399" }}>
                      {pct(s.perditaPct)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* EDITABLE SHOCK ASSUMPTIONS */}
        <Card>
          <SectionTitle icon={Settings2}>Ipotesi di shock (completamente modificabili)</SectionTitle>
          <p className="text-xs text-slate-500 mb-4">Variazione percentuale applicata a ciascuna classe di attivo in ogni scenario. Modifica i valori per costruire i tuoi scenari personalizzati.</p>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-400">
                  <th className="px-3 py-2 font-medium">Scenario</th>
                  {ASSET_CLASSES.map((a) => (
                    <th key={a.key} className="px-3 py-2 font-medium text-right">{a.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCENARIOS.map((s) => (
                  <tr key={s.key} className="border-t border-slate-800/70">
                    <td className="px-3 py-2 text-slate-300">{s.label}</td>
                    {ASSET_CLASSES.map((a) => (
                      <td key={a.key} className="px-3 py-1.5 text-right">
                        <input
                          type="number"
                          value={shocks[s.key][a.key]}
                          step={0.5}
                          onChange={(e) => updateShock(s.key, a.key, Number(e.target.value))}
                          className="w-20 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-right text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-rose-400"
                        />
                        <span className="text-slate-500 text-xs ml-1">%</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">
          Stress Test del Portafoglio · Simulazione interattiva a scopo puramente illustrativo · Tutti i parametri e le ipotesi di shock sono modificabili
        </p>
      </div>
    </div>
  );
}
