// @ts-nocheck
import React, { useMemo, useState } from "react";
import { ResponsiveContainer, ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Activity, Settings2, Table2, RefreshCcw, Gauge } from "lucide-react";

const DEFAULT_DATA = [
  { portafoglio: 12.5, benchmark: 9.0 }, { portafoglio: -18.2, benchmark: -12.0 }, { portafoglio: 24.0, benchmark: 18.0 },
  { portafoglio: 16.0, benchmark: 13.0 }, { portafoglio: -9.5, benchmark: -6.5 }, { portafoglio: 28.0, benchmark: 21.0 },
  { portafoglio: 10.0, benchmark: 8.5 }, { portafoglio: -4.0, benchmark: -2.0 }, { portafoglio: 20.0, benchmark: 15.5 },
  { portafoglio: 6.0, benchmark: 6.5 },
];

function Card({ children, className = "" }) {
  return <div className={"rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " + className}>{children}</div>;
}
function SectionTitle({ icon: Icon, children }) {
  return <div className="flex items-center gap-2 mb-4"><Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} /><h3 className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-400">{children}</h3></div>;
}
function SliderField({ label, value, min, max, step, onChange, suffix = "", accent = "violet" }) {
  const accentClass = accent === "amber" ? "accent-amber-400" : "accent-violet-400";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-0.5 text-right text-sm font-semibold text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-violet-400" />
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={"w-full h-1.5 rounded-full bg-slate-800 " + accentClass} />
      {suffix && <span className="text-[11px] text-slate-500 -mt-1">{suffix}</span>}
    </div>
  );
}
const tooltipStyle = { contentStyle: { background: "#0b0f17", border: "1px solid #232a3b", borderRadius: 10, fontSize: 12, color: "#e6e9f0" }, labelStyle: { color: "#94a3b8", marginBottom: 4 } };

export default function BetaVolatilityDashboard() {
  const [rows, setRows] = useState(DEFAULT_DATA);
  const [rf, setRf] = useState(2);

  const updateRow = (i, field, value) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  const resetDefaults = () => { setRows(DEFAULT_DATA); setRf(2); };

  const stats = useMemo(() => {
    const n = rows.length;
    const meanP = rows.reduce((s, r) => s + r.portafoglio, 0) / n;
    const meanB = rows.reduce((s, r) => s + r.benchmark, 0) / n;
    let cov = 0, varB = 0, varP = 0;
    rows.forEach((r) => {
      cov += (r.portafoglio - meanP) * (r.benchmark - meanB);
      varB += Math.pow(r.benchmark - meanB, 2);
      varP += Math.pow(r.portafoglio - meanP, 2);
    });
    cov /= n - 1; varB /= n - 1; varP /= n - 1;
    const beta = varB !== 0 ? cov / varB : 0;
    const stdP = Math.sqrt(varP), stdB = Math.sqrt(varB);
    const correlazione = stdP * stdB !== 0 ? cov / (stdP * stdB) : 0;
    const r2 = correlazione * correlazione;
    const interceptSimple = meanP - beta * meanB;
    const alphaJensen = meanP - (rf + beta * (meanB - rf));
    return { meanP, meanB, beta, correlazione, r2, interceptSimple, alphaJensen };
  }, [rows, rf]);

  const scatterData = rows.map((r) => ({ x: r.benchmark, y: r.portafoglio }));
  const xs = rows.map((r) => r.benchmark);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const lineData = [{ x: minX, y: stats.interceptSimple + stats.beta * minX }, { x: maxX, y: stats.interceptSimple + stats.beta * maxX }];

  const interpretazione = stats.beta > 1.1 ? "più nervoso (rischioso) del mercato" : stats.beta < 0.9 ? "più tranquillo (meno rischioso) del mercato" : "in linea con il mercato";

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/25 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0"><Activity className="w-5 h-5 text-violet-300" strokeWidth={1.75} /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analisi della Volatilità Relativa (Beta)</h1>
              <p className="text-sm text-slate-400 mt-1">Quanto il tuo portafoglio si muove rispetto al mercato globale</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">BETA</div>
            <div className="text-2xl sm:text-3xl font-bold text-violet-300 tabular-nums">{stats.beta.toFixed(2)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">ALPHA (JENSEN, ANNUO)</div>
            <div className={"text-2xl sm:text-3xl font-bold tabular-nums " + (stats.alphaJensen >= 0 ? "text-emerald-400" : "text-rose-400")}>{stats.alphaJensen >= 0 ? "+" : ""}{stats.alphaJensen.toFixed(2)}%</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">CORRELAZIONE</div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-300 tabular-nums">{stats.correlazione.toFixed(2)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">R²</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums">{stats.r2.toFixed(2)}</div>
          </Card>
        </div>

        <Card className="mb-6 border border-violet-500/30 bg-violet-950/10">
          <div className="flex items-start gap-3">
            <Gauge className="w-5 h-5 mt-0.5 shrink-0 text-violet-400" />
            <p className="text-xs text-slate-400">
              Con un beta di {stats.beta.toFixed(2)}, il tuo portafoglio è storicamente <span className="text-slate-100 font-semibold">{interpretazione}</span>: a un movimento dell'1% del benchmark corrisponde in media un movimento di circa {stats.beta.toFixed(2)}% nel tuo portafoglio. Un R² di {stats.r2.toFixed(2)} indica {stats.r2 > 0.7 ? "che gran parte dei tuoi movimenti è spiegata dal mercato" : "che una parte significativa dei tuoi movimenti dipende da fattori diversi dal mercato di riferimento"}.
            </p>
          </div>
        </Card>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Parametri</SectionTitle>
            <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"><RefreshCcw className="w-3.5 h-3.5" /> Ripristina</button>
          </div>
          <div className="max-w-xs">
            <SliderField label="Tasso privo di rischio (Rf)" value={rf} min={0} max={6} step={0.1} onChange={setRf} accent="amber" suffix="% annuo, per l'alpha di Jensen" />
          </div>
        </Card>

        <Card className="mb-5">
          <SectionTitle icon={Activity}>Dispersione dei rendimenti e retta di regressione</SectionTitle>
          <div style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 10, right: 20, left: 5, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" dataKey="x" name="Benchmark" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} tickFormatter={(v) => v + "%"} label={{ value: "Rendimento benchmark %", position: "bottom", offset: 0, fill: "#64748b", fontSize: 12 }} />
                <YAxis type="number" dataKey="y" name="Portafoglio" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v + "%"} label={{ value: "Rendimento portafoglio %", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 12 }} />
                <Tooltip {...tooltipStyle} formatter={(v) => v.toFixed(2) + "%"} cursor={{ strokeDasharray: "3 3" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Scatter name="Periodi osservati" data={scatterData} fill="#a78bfa" />
                <Line name="Retta di regressione" data={lineData} dataKey="y" stroke="#22d3ee" strokeWidth={2.5} dot={false} legendType="line" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Table2}>Rendimenti per periodo (modificabili)</SectionTitle>
          <div className="overflow-auto max-h-80 rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="text-left text-slate-400">
                  <th className="px-3 py-2 font-medium">Periodo</th>
                  <th className="px-3 py-2 font-medium text-right">Portafoglio %</th>
                  <th className="px-3 py-2 font-medium text-right">Benchmark %</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-slate-200">
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-800/70">
                    <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-1.5 text-right"><input type="number" step={0.1} value={r.portafoglio} onChange={(e) => updateRow(i, "portafoglio", Number(e.target.value))} className="w-20 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-right text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-violet-400" /></td>
                    <td className="px-3 py-1.5 text-right"><input type="number" step={0.1} value={r.benchmark} onChange={(e) => updateRow(i, "benchmark", Number(e.target.value))} className="w-20 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-right text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-violet-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">Analisi della Volatilità Relativa (Beta) · Simulazione interattiva a scopo puramente illustrativo · Tutti i valori sono modificabili</p>
      </div>
    </div>
  );
}
