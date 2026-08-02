// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Percent, Settings2, TrendingUp, Table2, RefreshCcw, Info } from "lucide-react";

/* ---------------------------------------------------------
   MODELLO
   TWR (Time-Weighted Return): incatena i rendimenti di ogni
   sotto-periodo, isolando la performance della strategia dai
   flussi di cassa dell'investitore.
   MWR (Money-Weighted Return, IRR): il tasso interno di
   rendimento sull'intera sequenza di flussi di cassa reali —
   riflette anche QUANDO sono stati versati o prelevati i soldi.
--------------------------------------------------------- */
function irr(cashflows, times) {
  const npv = (r) => cashflows.reduce((s, cf, i) => s + cf / Math.pow(1 + r, times[i]), 0);
  let lo = -0.99, hi = 5, flo = npv(lo), fhi = npv(hi);
  if (flo * fhi > 0) { hi = 20; fhi = npv(hi); if (flo * fhi > 0) return null; }
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2, fmid = npv(mid);
    if (Math.abs(fmid) < 1e-6) return mid;
    if ((flo < 0 && fmid < 0) || (flo > 0 && fmid > 0)) { lo = mid; flo = fmid; } else hi = mid;
  }
  return (lo + hi) / 2;
}

const eur = (v) => (v < 0 ? "-€" : "€") + Math.abs(Math.round(v)).toLocaleString("it-IT");
const pctFmt = (v) => (v >= 0 ? "+" : "") + (v * 100).toFixed(2) + "%";

function Card({ children, className = "" }) {
  return <div className={"rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " + className}>{children}</div>;
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
  const accentClass = accent === "cyan" ? "accent-cyan-400" : accent === "amber" ? "accent-amber-400" : "accent-violet-400";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-0.5 text-right text-sm font-semibold text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-violet-400" />
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className={"w-full h-1.5 rounded-full bg-slate-800 " + accentClass} />
      {suffix && <span className="text-[11px] text-slate-500 -mt-1">{suffix}</span>}
    </div>
  );
}
const tooltipStyle = { contentStyle: { background: "#0b0f17", border: "1px solid #232a3b", borderRadius: 10, fontSize: 12, color: "#e6e9f0" }, labelStyle: { color: "#94a3b8", marginBottom: 4 } };

const DEFAULT_ROWS = [
  { versamento: 0, valoreFine: 23000 },
  { versamento: 30000, valoreFine: 40000 },
  { versamento: 0, valoreFine: 46000 },
  { versamento: 0, valoreFine: 50000 },
  { versamento: -10000, valoreFine: 46000 },
  { versamento: 0, valoreFine: 52000 },
];

export default function TwrMwrDashboard() {
  const [capitaleIniziale, setCapitaleIniziale] = useState(20000);
  const [rows, setRows] = useState(DEFAULT_ROWS);

  const updateRow = (i, field, value) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  const resetDefaults = () => { setCapitaleIniziale(20000); setRows(DEFAULT_ROWS); };

  const periodi = useMemo(() => {
    let valoreInizio = capitaleIniziale;
    return rows.map((r) => {
      const base = valoreInizio + r.versamento;
      const rendimento = base !== 0 ? (r.valoreFine - base) / base : 0;
      const row = { valoreInizio, versamento: r.versamento, valoreFine: r.valoreFine, rendimento };
      valoreInizio = r.valoreFine;
      return row;
    });
  }, [capitaleIniziale, rows]);

  const twrTotale = periodi.reduce((acc, p) => acc * (1 + p.rendimento), 1) - 1;
  const twrAnnualizzato = Math.pow(1 + twrTotale, 1 / periodi.length) - 1;

  const mwrAnnualizzato = useMemo(() => {
    const n = rows.length;
    const times = Array.from({ length: n + 1 }, (_, i) => i);
    const cashflows = [-capitaleIniziale];
    rows.forEach((r, i) => {
      const isLast = i === n - 1;
      cashflows.push(isLast ? -r.versamento + r.valoreFine : -r.versamento);
    });
    return irr(cashflows, times);
  }, [capitaleIniziale, rows]);

  const gap = mwrAnnualizzato !== null ? mwrAnnualizzato - twrAnnualizzato : null;

  const chartBar = [
    { name: "TWR (strategia)", value: twrAnnualizzato * 100, fill: "#34d399" },
    { name: "MWR / IRR (i tuoi flussi)", value: (mwrAnnualizzato ?? 0) * 100, fill: "#38bdf8" },
  ];
  const growthChart = [{ anno: 0, valore: capitaleIniziale }, ...periodi.map((p, i) => ({ anno: i + 1, valore: p.valoreFine }))];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/25 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0"><Percent className="w-5 h-5 text-sky-300" strokeWidth={1.75} /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Time-Weighted vs Money-Weighted Return</h1>
              <p className="text-sm text-slate-400 mt-1">Le tue scelte di investimento o il timing dei tuoi versamenti? Scopri cosa guida davvero i tuoi rendimenti</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">TWR ANNUALIZZATO</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">{pctFmt(twrAnnualizzato)}</div>
            <div className="text-xs text-slate-500 mt-1">performance pura della strategia</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">MWR (IRR) ANNUALIZZATO</div>
            <div className="text-2xl sm:text-3xl font-bold text-sky-400 tabular-nums">{mwrAnnualizzato !== null ? pctFmt(mwrAnnualizzato) : "n/d"}</div>
            <div className="text-xs text-slate-500 mt-1">rendimento effettivo sui tuoi euro</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">GAP MWR − TWR</div>
            <div className={"text-2xl sm:text-3xl font-bold tabular-nums " + (gap >= 0 ? "text-emerald-400" : "text-rose-400")}>{gap !== null ? pctFmt(gap) : "n/d"}</div>
            <div className="text-xs text-slate-500 mt-1">{gap >= 0 ? "il timing dei versamenti ha aiutato" : "il timing dei versamenti ha penalizzato"}</div>
          </Card>
        </div>

        <Card className="mb-6 border border-sky-500/30 bg-sky-950/10">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 shrink-0 text-sky-400" />
            <p className="text-xs text-slate-400">
              Il TWR isola la bontà della strategia dai tuoi versamenti/prelievi. Il MWR (IRR) pesa invece l'importo e il momento di ogni flusso di cassa: se hai versato molto capitale poco prima di un calo di mercato, il MWR scenderà sotto il TWR, anche se la strategia sottostante era la stessa.
            </p>
          </div>
        </Card>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Capitale e flussi di cassa</SectionTitle>
            <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"><RefreshCcw className="w-3.5 h-3.5" /> Ripristina</button>
          </div>
          <div className="max-w-xs mb-5">
            <SliderField label="Capitale iniziale (anno 0)" value={capitaleIniziale} min={0} max={200000} step={1000} onChange={setCapitaleIniziale} suffix="€" />
          </div>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-400">
                  <th className="px-3 py-2 font-medium">Anno</th>
                  <th className="px-3 py-2 font-medium text-right">Valore inizio</th>
                  <th className="px-3 py-2 font-medium text-right">Versamento (−prelievo)</th>
                  <th className="px-3 py-2 font-medium text-right">Valore fine</th>
                  <th className="px-3 py-2 font-medium text-right">Rendimento periodo</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-slate-200">
                {periodi.map((p, i) => (
                  <tr key={i} className="border-t border-slate-800/70">
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2 text-right text-slate-400">{eur(p.valoreInizio)}</td>
                    <td className="px-3 py-1.5 text-right">
                      <input type="number" step={500} value={rows[i].versamento} onChange={(e) => updateRow(i, "versamento", Number(e.target.value))}
                        className="w-24 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-right text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-400" />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <input type="number" step={500} value={rows[i].valoreFine} onChange={(e) => updateRow(i, "valoreFine", Number(e.target.value))}
                        className="w-24 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-right text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-400" />
                    </td>
                    <td className="px-3 py-2 text-right" style={{ color: p.rendimento >= 0 ? "#34d399" : "#fb7185" }}>{pctFmt(p.rendimento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <SectionTitle icon={TrendingUp}>TWR vs MWR</SectionTitle>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartBar} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(0) + "%"} />
                  <Tooltip {...tooltipStyle} formatter={(v) => v.toFixed(2) + "%"} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>{chartBar.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <SectionTitle icon={Table2}>Valore del portafoglio nel tempo</SectionTitle>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="anno" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => "€" + (v / 1000).toFixed(0) + "k"} />
                  <Tooltip {...tooltipStyle} formatter={(v) => eur(v)} />
                  <Line type="monotone" dataKey="valore" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3, fill: "#38bdf8" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">TWR vs MWR · Simulazione interattiva a scopo puramente illustrativo · Tutti i valori sono modificabili</p>
      </div>
    </div>
  );
}
