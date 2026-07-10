// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import {
  Scale, Settings2, ArrowLeftRight, Table2, RefreshCcw, Gauge,
} from "lucide-react";

/* ---------------------------------------------------------
   MODELLO
   Ogni classe di attivo ha un valore attuale (€) e un peso
   target (%). Il drift è la differenza tra peso attuale e
   target. Il piano di ribilanciamento riporta ogni classe
   esattamente al proprio target, a parità di controvalore
   totale del portafoglio (vendite finanziano gli acquisti).
--------------------------------------------------------- */
const eur = (v) =>
  (v < 0 ? "-€" : "€") + Math.abs(Math.round(v)).toLocaleString("it-IT", { maximumFractionDigits: 0 });
const pct = (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "%";

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
    accent === "cyan" ? "accent-cyan-400" : accent === "amber" ? "accent-amber-400" : accent === "emerald" ? "accent-emerald-400" : "accent-violet-400";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <input
          type="number" value={value} step={step}
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

const ASSET_CLASSES = [
  { key: "azioni", label: "Azioni", color: "#22d3ee" },
  { key: "obbligazioni", label: "Obbligazioni", color: "#a78bfa" },
  { key: "liquidita", label: "Liquidità", color: "#34d399" },
  { key: "immobiliare", label: "Immobiliare", color: "#fbbf24" },
];

/* ---------------------------------------------------------
   MAIN DASHBOARD
--------------------------------------------------------- */
export default function RebalancingDriftAnalysis() {
  const [valori, setValori] = useState({ azioni: 91000, obbligazioni: 42000, liquidita: 12000, immobiliare: 15000 });
  const [targetAzioni, setTargetAzioni] = useState(60);
  const [targetObbligazioni, setTargetObbligazioni] = useState(30);
  const [targetImmobiliare, setTargetImmobiliare] = useState(5);
  const targetLiquidita = Math.max(0, 100 - targetAzioni - targetObbligazioni - targetImmobiliare);
  const targets = { azioni: targetAzioni, obbligazioni: targetObbligazioni, liquidita: targetLiquidita, immobiliare: targetImmobiliare };

  const [sogliaBanda, setSogliaBanda] = useState(5);

  const updateValore = (key, value) => setValori((prev) => ({ ...prev, [key]: value }));

  const resetDefaults = () => {
    setValori({ azioni: 91000, obbligazioni: 42000, liquidita: 12000, immobiliare: 15000 });
    setTargetAzioni(60); setTargetObbligazioni(30); setTargetImmobiliare(5);
    setSogliaBanda(5);
  };

  const totale = useMemo(() => ASSET_CLASSES.reduce((s, a) => s + valori[a.key], 0), [valori]);

  const rows = useMemo(() => {
    return ASSET_CLASSES.map((a) => {
      const valoreAttuale = valori[a.key];
      const pesoAttuale = totale > 0 ? (valoreAttuale / totale) * 100 : 0;
      const target = targets[a.key];
      const valoreTarget = totale * (target / 100);
      const drift = pesoAttuale - target;
      const delta = valoreTarget - valoreAttuale; // positivo = comprare, negativo = vendere
      const fuoriSoglia = Math.abs(drift) > sogliaBanda;
      return { ...a, valoreAttuale, pesoAttuale, target, valoreTarget, drift, delta, fuoriSoglia };
    });
  }, [valori, targets, totale, sogliaBanda]);

  const maxDriftRow = rows.reduce((a, b) => (Math.abs(b.drift) > Math.abs(a.drift) ? b : a), rows[0]);
  const totaleDaMovimentare = rows.reduce((s, r) => s + Math.abs(r.delta), 0) / 2;
  const richiedeRibilanciamento = rows.some((r) => r.fuoriSoglia);

  const barCompare = rows.flatMap((r) => [
    { name: r.label, tipo: "Attuale", valore: r.pesoAttuale, fill: r.color, opacity: 1 },
  ]);
  const compareData = rows.map((r) => ({ name: r.label, Attuale: r.pesoAttuale, Target: r.target }));

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* HEADER */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/30 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-violet-300" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rebalancing &amp; Drift Analysis</h1>
              <p className="text-sm text-slate-400 mt-1">
                Quanto il tuo portafoglio si è discostato dal target — e il piano matematico per riportarlo in linea
              </p>
            </div>
          </div>
        </div>

        {/* KPI ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">VALORE TOTALE PORTAFOGLIO</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums">{eur(totale)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">MAGGIOR DRIFT</div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">{pct(maxDriftRow.drift)}</div>
            <div className="text-xs text-slate-500 mt-1">{maxDriftRow.label}: sei al {maxDriftRow.pesoAttuale.toFixed(1)}%, target {maxDriftRow.target.toFixed(1)}%</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">CAPITALE DA MOVIMENTARE</div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-300 tabular-nums">{eur(totaleDaMovimentare)}</div>
            <div className="text-xs text-slate-500 mt-1">per riportare tutte le classi a target</div>
          </Card>
        </div>

        {/* BANNER */}
        <Card className={"mb-6 border " + (richiedeRibilanciamento ? "border-amber-500/40 bg-amber-950/20" : "border-emerald-500/40 bg-emerald-950/20")}>
          <div className="flex items-start gap-3">
            <Gauge className={"w-5 h-5 mt-0.5 shrink-0 " + (richiedeRibilanciamento ? "text-amber-400" : "text-emerald-400")} />
            <div>
              <div className="text-sm font-semibold text-slate-100">
                {richiedeRibilanciamento
                  ? "Almeno una classe di attivo ha superato la soglia di tolleranza"
                  : "Tutte le classi di attivo sono entro la soglia di tolleranza"}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Con una banda di tolleranza del ±{sogliaBanda}%, {richiedeRibilanciamento
                  ? "conviene eseguire il ribilanciamento indicato di seguito."
                  : "non è necessaria alcuna azione: il portafoglio è ancora coerente con il profilo di rischio target."}
              </p>
            </div>
          </div>
        </Card>

        {/* PARAMETERS */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Valori attuali e target</SectionTitle>
            <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              <RefreshCcw className="w-3.5 h-3.5" /> Ripristina
            </button>
          </div>

          <div className="text-xs font-semibold tracking-wide uppercase text-slate-500 mb-2">Valore attuale per classe (€)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <SliderField label="Azioni" value={valori.azioni} min={0} max={500000} step={1000} onChange={(v) => updateValore("azioni", v)} accent="cyan" suffix="€" />
            <SliderField label="Obbligazioni" value={valori.obbligazioni} min={0} max={500000} step={1000} onChange={(v) => updateValore("obbligazioni", v)} suffix="€" />
            <SliderField label="Liquidità" value={valori.liquidita} min={0} max={500000} step={1000} onChange={(v) => updateValore("liquidita", v)} accent="emerald" suffix="€" />
            <SliderField label="Immobiliare" value={valori.immobiliare} min={0} max={500000} step={1000} onChange={(v) => updateValore("immobiliare", v)} accent="amber" suffix="€" />
          </div>

          <div className="text-xs font-semibold tracking-wide uppercase text-slate-500 mb-2">Allocazione target (%)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-3">
            <SliderField label="Azioni target" value={targetAzioni} min={0} max={100} step={1} onChange={setTargetAzioni} accent="cyan" suffix="%" />
            <SliderField label="Obbligazioni target" value={targetObbligazioni} min={0} max={100} step={1} onChange={setTargetObbligazioni} suffix="%" />
            <SliderField label="Immobiliare target" value={targetImmobiliare} min={0} max={100} step={1} onChange={setTargetImmobiliare} accent="amber" suffix="%" />
          </div>
          <div className="text-xs text-slate-500 mb-5">
            Liquidità target (calcolata automaticamente): <span className="text-slate-200 font-semibold">{targetLiquidita.toFixed(0)}%</span>
          </div>

          <SliderField label="Soglia di tolleranza (banda di ribilanciamento)" value={sogliaBanda} min={1} max={20} step={0.5} onChange={setSogliaBanda} accent="amber" suffix="% di scostamento accettato prima di agire" />
        </Card>

        {/* ATTUALE VS TARGET CHART */}
        <Card className="mb-5">
          <SectionTitle icon={ArrowLeftRight}>Peso attuale vs target</SectionTitle>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis width={50} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v + "%"} />
                <Tooltip {...tooltipStyle} formatter={(v) => v.toFixed(1) + "%"} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Bar dataKey="Attuale" fill="#a78bfa" radius={[6, 6, 0, 0]} maxBarSize={50} />
                <Bar dataKey="Target" fill="#475569" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* DRIFT CHART */}
        <Card className="mb-5">
          <SectionTitle icon={Scale}>Indicatore di drift</SectionTitle>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.map((r) => ({ name: r.label, drift: r.drift }))} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis width={50} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v + "%"} />
                <Tooltip {...tooltipStyle} formatter={(v) => pct(v)} />
                <ReferenceLine y={sogliaBanda} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={-sogliaBanda} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="drift" radius={[6, 6, 6, 6]} maxBarSize={60}>
                  {rows.map((r, i) => <Cell key={i} fill={Math.abs(r.drift) > sogliaBanda ? "#fb7185" : "#34d399"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">Le linee tratteggiate indicano la banda di tolleranza (±{sogliaBanda}%). Barre rosse = fuori soglia.</p>
        </Card>

        {/* REBALANCING PLAN TABLE */}
        <Card>
          <SectionTitle icon={Table2}>Piano di ribilanciamento</SectionTitle>
          <div className="overflow-auto rounded-xl border border-slate-800 mb-4">
            <table className="w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-400">
                  <th className="px-3 py-2 font-medium">Classe</th>
                  <th className="px-3 py-2 font-medium text-right">Valore attuale</th>
                  <th className="px-3 py-2 font-medium text-right">Peso attuale</th>
                  <th className="px-3 py-2 font-medium text-right">Target</th>
                  <th className="px-3 py-2 font-medium text-right">Drift</th>
                  <th className="px-3 py-2 font-medium text-right">Azione</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-slate-200">
                {rows.map((r) => (
                  <tr key={r.key} className="border-t border-slate-800/70">
                    <td className="px-3 py-2 text-slate-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: r.color }} />
                      {r.label}
                    </td>
                    <td className="px-3 py-2 text-right">{eur(r.valoreAttuale)}</td>
                    <td className="px-3 py-2 text-right">{r.pesoAttuale.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right text-slate-400">{r.target.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right" style={{ color: Math.abs(r.drift) > sogliaBanda ? "#fb7185" : "#34d399" }}>{pct(r.drift)}</td>
                    <td className="px-3 py-2 text-right font-medium" style={{ color: r.delta >= 0 ? "#34d399" : "#fb7185" }}>
                      {r.delta >= 0 ? `Compra ${eur(r.delta)}` : `Vendi ${eur(Math.abs(r.delta))}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">
            Il piano riporta ogni classe esattamente al proprio peso target mantenendo invariato il valore totale del portafoglio ({eur(totale)}): le vendite sulle classi in eccesso finanziano gli acquisti su quelle in difetto — la logica sistematica del "vendi alto, compra basso".
          </p>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">
          Rebalancing &amp; Drift Analysis · Simulazione interattiva a scopo puramente illustrativo · Tutti i parametri sono modificabili
        </p>
      </div>
    </div>
  );
}
