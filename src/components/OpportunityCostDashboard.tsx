// @ts-nocheck
import React, { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { GitCompare, Settings2, TrendingUp, Table2, RefreshCcw } from "lucide-react";

const DEFAULT_A = [12, -8, 22, 15, -3, 28, 9, -15, 19, 14];
const DEFAULT_B = [7, 3, 6, 8, 4, 5, 9, 2, 7, 6];

const eur = (v) => (v < 0 ? "-€" : "€") + Math.abs(Math.round(v)).toLocaleString("it-IT");

function simulate(initial, pmt, returns) {
  let balance = initial;
  const yearly = [{ anno: 0, valore: balance }];
  returns.forEach((r, i) => { balance += pmt; balance *= 1 + r / 100; yearly.push({ anno: i + 1, valore: balance }); });
  return yearly;
}

function Card({ children, className = "" }) {
  return <div className={"rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " + className}>{children}</div>;
}
function SectionTitle({ icon: Icon, children }) {
  return <div className="flex items-center gap-2 mb-4"><Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} /><h3 className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-400">{children}</h3></div>;
}
function SliderField({ label, value, min, max, step, onChange, suffix = "", accent = "violet" }) {
  const accentClass = accent === "cyan" ? "accent-cyan-400" : accent === "emerald" ? "accent-emerald-400" : "accent-violet-400";
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

export default function OpportunityCostDashboard() {
  const [capitaleIniziale, setCapitaleIniziale] = useState(10000);
  const [pmtAnnuo, setPmtAnnuo] = useState(2000);
  const [liquiditaRate, setLiquiditaRate] = useState(0.5);
  const [returnsA, setReturnsA] = useState(DEFAULT_A);
  const [returnsB, setReturnsB] = useState(DEFAULT_B);
  const [scelta, setScelta] = useState("A");

  const updateReturn = (which, idx, value) => {
    const setter = which === "A" ? setReturnsA : setReturnsB;
    setter((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };
  const resetDefaults = () => { setCapitaleIniziale(10000); setPmtAnnuo(2000); setLiquiditaRate(0.5); setReturnsA(DEFAULT_A); setReturnsB(DEFAULT_B); setScelta("A"); };

  const anni = returnsA.length;
  const liquiditaReturns = useMemo(() => Array(anni).fill(liquiditaRate), [anni, liquiditaRate]);

  const pathA = useMemo(() => simulate(capitaleIniziale, pmtAnnuo, returnsA), [capitaleIniziale, pmtAnnuo, returnsA]);
  const pathB = useMemo(() => simulate(capitaleIniziale, pmtAnnuo, returnsB), [capitaleIniziale, pmtAnnuo, returnsB]);
  const pathLiq = useMemo(() => simulate(capitaleIniziale, pmtAnnuo, liquiditaReturns), [capitaleIniziale, pmtAnnuo, liquiditaReturns]);

  const finalA = pathA[pathA.length - 1].valore;
  const finalB = pathB[pathB.length - 1].valore;
  const finalLiq = pathLiq[pathLiq.length - 1].valore;

  const finali = { A: finalA, B: finalB, Liquidita: finalLiq };
  const migliore = Object.entries(finali).reduce((a, b) => (b[1] > a[1] ? b : a));
  const costoOpportunita = migliore[1] - finali[scelta];

  const chartData = pathA.map((p, i) => ({ anno: p.anno, "Asset A": p.valore, "Asset B": pathB[i].valore, "Liquidità": pathLiq[i].valore }));

  const nomeScelta = { A: "Asset A", B: "Asset B", Liquidita: "Liquidità" };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/25 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0"><GitCompare className="w-5 h-5 text-cyan-300" strokeWidth={1.75} /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Simulatore di Costo Opportunità</h1>
              <p className="text-sm text-slate-400 mt-1">Cosa avresti ottenuto scegliendo l'alternativa — e quanto ti è costato non farlo</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">CAPITALE FINALE — ASSET A</div>
            <div className="text-2xl sm:text-3xl font-bold text-violet-300 tabular-nums">{eur(finalA)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">CAPITALE FINALE — ASSET B</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">{eur(finalB)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">CAPITALE FINALE — LIQUIDITÀ</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-400 tabular-nums">{eur(finalLiq)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">COSTO OPPORTUNITÀ (vs {nomeScelta[scelta]})</div>
            <div className={"text-2xl sm:text-3xl font-bold tabular-nums " + (costoOpportunita > 0 ? "text-rose-400" : "text-emerald-400")}>{eur(costoOpportunita)}</div>
            <div className="text-xs text-slate-500 mt-1">migliore alternativa: {migliore[0] === scelta ? "quella scelta" : nomeScelta[migliore[0]]}</div>
          </Card>
        </div>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Parametri</SectionTitle>
            <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"><RefreshCcw className="w-3.5 h-3.5" /> Ripristina</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
            <SliderField label="Capitale iniziale" value={capitaleIniziale} min={0} max={200000} step={1000} onChange={setCapitaleIniziale} suffix="€" />
            <SliderField label="Versamento annuo" value={pmtAnnuo} min={0} max={30000} step={500} onChange={setPmtAnnuo} accent="emerald" suffix="€" />
            <SliderField label="Rendimento liquidità" value={liquiditaRate} min={0} max={5} step={0.1} onChange={setLiquiditaRate} suffix="% annuo (conto/deposito)" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Cosa hai effettivamente scelto?</span>
            <div className="flex rounded-lg border border-slate-800 overflow-hidden">
              {["A", "B", "Liquidita"].map((k) => (
                <button key={k} onClick={() => setScelta(k)} className={"px-3 py-1.5 text-xs font-medium " + (scelta === k ? "bg-cyan-500/20 text-cyan-200" : "text-slate-400")}>{nomeScelta[k]}</button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="mb-5">
          <SectionTitle icon={TrendingUp}>Traiettorie a confronto</SectionTitle>
          <div style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="anno" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis width={70} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => "€" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip {...tooltipStyle} formatter={(v) => eur(v)} labelFormatter={(y) => `Anno ${y}`} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Line type="monotone" dataKey="Asset A" stroke="#a78bfa" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Asset B" stroke="#34d399" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Liquidità" stroke="#64748b" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Table2}>Rendimenti annuali per asset (modificabili)</SectionTitle>
          <p className="text-xs text-slate-500 mb-3">Serie illustrative. Modifica ogni valore per confrontare i tuoi scenari reali.</p>
          {[["A", returnsA, "#a78bfa"], ["B", returnsB, "#34d399"]].map(([label, arr, color]) => (
            <div key={label} className="mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />Asset {label}</div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {arr.map((v, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-500">A{i + 1}</span>
                    <input type="number" step={0.5} value={v} onChange={(e) => updateReturn(label, i, Number(e.target.value))}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-md px-1.5 py-1 text-right text-xs font-medium text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-cyan-400" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">Simulatore di Costo Opportunità · Simulazione interattiva a scopo puramente illustrativo · Tutti i valori sono modificabili</p>
      </div>
    </div>
  );
}
