// @ts-nocheck
import React, { useMemo, useState } from "react";
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingDown, Settings2, Table2, RefreshCcw, ShieldCheck } from "lucide-react";

const DEFAULT_SERIES = {
  azionario: [8, -9, -12, 24, 9, 4, -18, 26, 14, 1, 10, 19, -4, 29, -6, 16, 25, -21, 24, 12],
  obbligazionario: [3, 4, 2, -2, 5, 3, 6, -3, 2, 4, 1, -1, 3, 2, -13, 5, 3, -4, 5, 2],
  emergenti: [15, -22, -6, 30, 12, -3, -27, 35, 18, -2, 8, 30, -8, 20, -9, 20, 30, -30, 25, 10],
};
const ASSETS = [
  { key: "azionario", label: "Azionario Globale", color: "#22d3ee" },
  { key: "obbligazionario", label: "Obbligazionario", color: "#a78bfa" },
  { key: "emergenti", label: "Azionario Emergenti", color: "#fb7185" },
];

function computeSeries(returns) {
  let value = 100, peak = 100;
  const out = [{ anno: 0, valore: 100, drawdown: 0 }];
  let maxDD = 0, maxDDStart = 0, maxDDEnd = 0, ddStartYear = 0;
  returns.forEach((r, i) => {
    value *= 1 + r / 100;
    if (value > peak) { peak = value; ddStartYear = i + 1; }
    const dd = (value - peak) / peak * 100;
    if (dd < maxDD) { maxDD = dd; maxDDStart = ddStartYear; maxDDEnd = i + 1; }
    out.push({ anno: i + 1, valore: value, drawdown: dd });
  });
  const drawdownAttuale = out[out.length - 1].drawdown;
  return { series: out, maxDD, maxDDStart, maxDDEnd, drawdownAttuale };
}

function Card({ children, className = "" }) {
  return <div className={"rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " + className}>{children}</div>;
}
function SectionTitle({ icon: Icon, children }) {
  return <div className="flex items-center gap-2 mb-4"><Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} /><h3 className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-400">{children}</h3></div>;
}
const tooltipStyle = { contentStyle: { background: "#0b0f17", border: "1px solid #232a3b", borderRadius: 10, fontSize: 12, color: "#e6e9f0" }, labelStyle: { color: "#94a3b8", marginBottom: 4 } };

export default function MaxDrawdownDashboard() {
  const [series, setSeries] = useState(DEFAULT_SERIES);
  const [selected, setSelected] = useState("azionario");

  const updateValue = (assetKey, idx, value) =>
    setSeries((prev) => ({ ...prev, [assetKey]: prev[assetKey].map((v, i) => (i === idx ? value : v)) }));
  const resetDefaults = () => setSeries(DEFAULT_SERIES);

  const computed = useMemo(() => {
    const out = {};
    ASSETS.forEach((a) => { out[a.key] = computeSeries(series[a.key]); });
    return out;
  }, [series]);

  const current = computed[selected];
  const currentAsset = ASSETS.find((a) => a.key === selected);
  const rapportoAttualeMax = current.maxDD !== 0 ? Math.abs(current.drawdownAttuale / current.maxDD) * 100 : 0;
  const dentroNorma = rapportoAttualeMax < 60;

  const chartData = current.series;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/25 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0"><TrendingDown className="w-5 h-5 text-rose-300" strokeWidth={1.75} /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Drawdown Massimo Storico</h1>
              <p className="text-sm text-slate-400 mt-1">Conosci il tuo "livello di panico" prima che il mercato te lo mostri sul serio</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {ASSETS.map((a) => (
            <button key={a.key} onClick={() => setSelected(a.key)}
              className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors " + (selected === a.key ? "bg-rose-500/20 border-rose-400 text-rose-200" : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600")}>
              {a.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">MAX DRAWDOWN STORICO — {currentAsset.label.toUpperCase()}</div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-400 tabular-nums">{current.maxDD.toFixed(1)}%</div>
            <div className="text-xs text-slate-500 mt-1">dall'anno {current.maxDDStart} all'anno {current.maxDDEnd}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">DRAWDOWN ATTUALE (ultimo anno)</div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">{current.drawdownAttuale.toFixed(1)}%</div>
            <div className="text-xs text-slate-500 mt-1">rispetto al picco più recente</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">% DEL MAX STORICO GIÀ VISTO</div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-300 tabular-nums">{rapportoAttualeMax.toFixed(0)}%</div>
          </Card>
        </div>

        <Card className={"mb-6 border " + (dentroNorma ? "border-emerald-500/40 bg-emerald-950/20" : "border-amber-500/40 bg-amber-950/20")}>
          <div className="flex items-start gap-3">
            <ShieldCheck className={"w-5 h-5 mt-0.5 shrink-0 " + (dentroNorma ? "text-emerald-400" : "text-amber-400")} />
            <p className="text-xs text-slate-400">
              Storicamente {currentAsset.label.toLowerCase()} ha perso fino al <span className="text-slate-100 font-semibold">{Math.abs(current.maxDD).toFixed(0)}%</span> dal picco. Il calo attuale del {Math.abs(current.drawdownAttuale).toFixed(1)}%
              {dentroNorma ? " rientra nella norma storica: potrebbe non essere il momento di vendere in preda al panico." : " si avvicina o supera il precedente record storico: vale la pena rivedere con attenzione la propria esposizione."}
            </p>
          </div>
        </Card>

        <Card className="mb-5">
          <SectionTitle icon={TrendingDown}>Indice cumulato e drawdown (base 100)</SectionTitle>
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="anno" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis yAxisId="left" width={55} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" width={55} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v + "%"} />
                <Tooltip {...tooltipStyle} formatter={(v, name) => (name === "drawdown" ? v.toFixed(1) + "%" : v.toFixed(1))} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Line yAxisId="left" type="monotone" dataKey="valore" name="Indice (base 100)" stroke={currentAsset.color} strokeWidth={2.5} dot={false} />
                <Area yAxisId="right" type="monotone" dataKey="drawdown" name="Drawdown" stroke="#fb7185" fill="#fb7185" fillOpacity={0.25} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Table2}>Rendimenti annuali per asset (modificabili)</SectionTitle>
          <p className="text-xs text-slate-500 mb-3">Serie illustrative, non rappresentano rendimenti reali di un indice specifico. Modifica ogni valore per costruire i tuoi scenari.</p>
          {ASSETS.map((a) => (
            <div key={a.key} className="mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: a.color }} />{a.label}</div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {series[a.key].map((v, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-500">A{i + 1}</span>
                    <input type="number" step={0.5} value={v} onChange={(e) => updateValue(a.key, i, Number(e.target.value))}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-md px-1.5 py-1 text-right text-xs font-medium text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-rose-400" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mt-2"><RefreshCcw className="w-3.5 h-3.5" /> Ripristina tutte le serie</button>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">Drawdown Massimo Storico · Simulazione interattiva a scopo puramente illustrativo · Tutti i valori sono modificabili</p>
      </div>
    </div>
  );
}
