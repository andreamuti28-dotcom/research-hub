// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { Activity, Settings2, TrendingUp, Table2, RefreshCcw } from "lucide-react";

const DEFAULT_DATA = [
  { fondo: 1.8, bench: 2.0 }, { fondo: -0.9, bench: -0.7 }, { fondo: 2.4, bench: 2.6 },
  { fondo: 1.1, bench: 1.3 }, { fondo: -3.2, bench: -2.9 }, { fondo: 4.0, bench: 4.3 },
  { fondo: 1.6, bench: 1.8 }, { fondo: 0.4, bench: 0.6 }, { fondo: 2.9, bench: 3.1 },
  { fondo: -1.5, bench: -1.2 }, { fondo: 3.3, bench: 3.6 }, { fondo: 1.0, bench: 1.2 },
];

const eur = (v) => (v < 0 ? "-€" : "€") + Math.abs(Math.round(v)).toLocaleString("it-IT");

function Card({ children, className = "" }) {
  return <div className={"rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " + className}>{children}</div>;
}
function SectionTitle({ icon: Icon, children }) {
  return <div className="flex items-center gap-2 mb-4"><Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} /><h3 className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-400">{children}</h3></div>;
}
function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-slate-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm font-medium text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-400">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
const tooltipStyle = { contentStyle: { background: "#0b0f17", border: "1px solid #232a3b", borderRadius: 10, fontSize: 12, color: "#e6e9f0" }, labelStyle: { color: "#94a3b8", marginBottom: 4 } };

function stdDev(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export default function TrackingErrorDashboard() {
  const [capitale, setCapitale] = useState(50000);
  const [periodicita, setPeriodicita] = useState("mensile");
  const [rows, setRows] = useState(DEFAULT_DATA);

  const updateRow = (i, field, value) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  const resetDefaults = () => { setCapitale(50000); setPeriodicita("mensile"); setRows(DEFAULT_DATA); };

  const excess = rows.map((r) => r.fondo - r.bench);
  const teGrezzo = stdDev(excess);
  const fattoreAnnualizzazione = periodicita === "mensile" ? Math.sqrt(12) : 1;
  const trackingError = teGrezzo * fattoreAnnualizzazione;

  const mediaFondo = rows.reduce((a, b) => a + b.fondo, 0) / rows.length;
  const mediaBench = rows.reduce((a, b) => a + b.bench, 0) / rows.length;
  const mediaExcess = mediaFondo - mediaBench;
  const informationRatio = trackingError !== 0 ? (mediaExcess * (periodicita === "mensile" ? 12 : 1)) / trackingError : 0;

  const cumulativeChart = useMemo(() => {
    let idxFondo = 100, idxBench = 100;
    return [{ periodo: 0, Fondo: 100, Benchmark: 100 }, ...rows.map((r, i) => {
      idxFondo *= 1 + r.fondo / 100; idxBench *= 1 + r.bench / 100;
      return { periodo: i + 1, Fondo: idxFondo, Benchmark: idxBench };
    })];
  }, [rows]);

  const excessChart = rows.map((r, i) => ({ periodo: i + 1, excess: r.fondo - r.bench }));
  const costoImplicito = capitale * (mediaExcess / 100) * rows.length;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-fuchsia-950/25 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0"><Activity className="w-5 h-5 text-fuchsia-300" strokeWidth={1.75} /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analisi dell'Errore di Tracking</h1>
              <p className="text-sm text-slate-400 mt-1">Quanto il tuo fondo o ETF si discosta dal benchmark — e cosa ti sta costando</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">TRACKING ERROR ANNUALIZZATO</div>
            <div className="text-2xl sm:text-3xl font-bold text-fuchsia-400 tabular-nums">{trackingError.toFixed(2)}%</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">RENDIMENTO MEDIO FONDO</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums">{mediaFondo.toFixed(2)}%</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">SCARTO MEDIO vs BENCHMARK</div>
            <div className={"text-2xl sm:text-3xl font-bold tabular-nums " + (mediaExcess >= 0 ? "text-emerald-400" : "text-rose-400")}>{mediaExcess >= 0 ? "+" : ""}{mediaExcess.toFixed(2)}%</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">INFORMATION RATIO</div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-300 tabular-nums">{informationRatio.toFixed(2)}</div>
          </Card>
        </div>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Parametri</SectionTitle>
            <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"><RefreshCcw className="w-3.5 h-3.5" /> Ripristina</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl mb-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-400">Capitale investito</span>
              <input type="number" value={capitale} step={1000} onChange={(e) => setCapitale(Number(e.target.value))}
                className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm font-semibold text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-fuchsia-400" />
            </div>
            <SelectField label="Periodicità dei dati" value={periodicita} onChange={setPeriodicita} options={[{ value: "mensile", label: "Mensile" }, { value: "annuale", label: "Annuale" }]} />
          </div>
        </Card>

        <Card className="mb-5">
          <SectionTitle icon={TrendingUp}>Crescita cumulata (base 100)</SectionTitle>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeChart} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="periodo" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis width={55} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => v.toFixed(1)} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Line type="monotone" dataKey="Fondo" stroke="#e879f9" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Benchmark" stroke="#64748b" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="mb-5">
          <SectionTitle icon={Activity}>Scarto di rendimento per periodo (Fondo − Benchmark)</SectionTitle>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={excessChart} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="periodo" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis width={50} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v + "%"} />
                <Tooltip {...tooltipStyle} formatter={(v) => v.toFixed(2) + "%"} />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="excess" radius={[4, 4, 4, 4]} maxBarSize={40}>{excessChart.map((d, i) => <Cell key={i} fill={d.excess >= 0 ? "#34d399" : "#fb7185"} />)}</Bar>
              </BarChart>
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
                  <th className="px-3 py-2 font-medium text-right">Fondo %</th>
                  <th className="px-3 py-2 font-medium text-right">Benchmark %</th>
                  <th className="px-3 py-2 font-medium text-right">Scarto</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-slate-200">
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-800/70">
                    <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-1.5 text-right">
                      <input type="number" step={0.1} value={r.fondo} onChange={(e) => updateRow(i, "fondo", Number(e.target.value))}
                        className="w-20 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-right text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-fuchsia-400" />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <input type="number" step={0.1} value={r.bench} onChange={(e) => updateRow(i, "bench", Number(e.target.value))}
                        className="w-20 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-right text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-fuchsia-400" />
                    </td>
                    <td className="px-3 py-1.5 text-right" style={{ color: r.fondo - r.bench >= 0 ? "#34d399" : "#fb7185" }}>{(r.fondo - r.bench).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">Analisi dell'Errore di Tracking · Simulazione interattiva a scopo puramente illustrativo · Tutti i valori sono modificabili</p>
      </div>
    </div>
  );
}
