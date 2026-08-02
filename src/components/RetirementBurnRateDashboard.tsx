// @ts-nocheck
import React, { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Wallet, Settings2, TrendingDown, Table2, RefreshCcw, AlertTriangle } from "lucide-react";

const DEFAULT_RETURNS = [
  6, -15, 8, 12, -8, 5, 18, 4, -22, 20, 9, 6, -3, 14, 7, 11, -18, 22, 10, 5,
  8, -6, 13, 9, 4, -10, 16, 7, 6, 5,
];

const eur = (v) => (v < 0 ? "-€" : "€") + Math.abs(Math.round(v)).toLocaleString("it-IT");

function Card({ children, className = "" }) {
  return <div className={"rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " + className}>{children}</div>;
}
function SectionTitle({ icon: Icon, children }) {
  return <div className="flex items-center gap-2 mb-4"><Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} /><h3 className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-400">{children}</h3></div>;
}
function SliderField({ label, value, min, max, step, onChange, suffix = "", accent = "violet" }) {
  const accentClass = accent === "rose" ? "accent-rose-400" : accent === "emerald" ? "accent-emerald-400" : accent === "amber" ? "accent-amber-400" : "accent-violet-400";
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

function simulateFisso(capitaleIniziale, tassoIniziale, inflazione, returns) {
  let balance = capitaleIniziale;
  let prelievo = capitaleIniziale * (tassoIniziale / 100);
  const yearly = [{ anno: 0, balance, prelievo: 0 }];
  let annoEsaurimento = null;
  returns.forEach((r, i) => {
    balance -= prelievo;
    if (balance <= 0) { balance = 0; if (annoEsaurimento === null) annoEsaurimento = i + 1; }
    balance *= 1 + r / 100;
    yearly.push({ anno: i + 1, balance, prelievo });
    prelievo *= 1 + inflazione / 100;
  });
  return { yearly, annoEsaurimento, balanceFinale: balance };
}

function simulateVariabile(capitaleIniziale, tassoVariabile, returns) {
  let balance = capitaleIniziale;
  const yearly = [{ anno: 0, balance, prelievo: 0 }];
  const prelievi = [];
  returns.forEach((r, i) => {
    const prelievo = balance * (tassoVariabile / 100);
    balance -= prelievo;
    balance *= 1 + r / 100;
    prelievi.push(prelievo);
    yearly.push({ anno: i + 1, balance, prelievo });
  });
  return { yearly, balanceFinale: balance, prelievoMedio: prelievi.reduce((a, b) => a + b, 0) / prelievi.length };
}

export default function RetirementBurnRateDashboard() {
  const [capitaleIniziale, setCapitaleIniziale] = useState(600000);
  const [tassoFisso, setTassoFisso] = useState(4);
  const [inflazione, setInflazione] = useState(2);
  const [tassoVariabile, setTassoVariabile] = useState(5);
  const [returns, setReturns] = useState(DEFAULT_RETURNS);
  const [anni, setAnni] = useState(30);

  const sequence = useMemo(() => returns.slice(0, anni), [returns, anni]);
  const updateReturn = (i, value) => setReturns((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  const resetDefaults = () => { setCapitaleIniziale(600000); setTassoFisso(4); setInflazione(2); setTassoVariabile(5); setReturns(DEFAULT_RETURNS); setAnni(30); };

  const fisso = useMemo(() => simulateFisso(capitaleIniziale, tassoFisso, inflazione, sequence), [capitaleIniziale, tassoFisso, inflazione, sequence]);
  const variabile = useMemo(() => simulateVariabile(capitaleIniziale, tassoVariabile, sequence), [capitaleIniziale, tassoVariabile, sequence]);

  const chartData = fisso.yearly.map((f, i) => ({ anno: f.anno, "Prelievo fisso": f.balance, "Prelievo variabile": variabile.yearly[i].balance }));
  const prelievoFissoAttuale = capitaleIniziale * (tassoFisso / 100);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/25 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0"><Wallet className="w-5 h-5 text-amber-300" strokeWidth={1.75} /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Burn Rate in Retirement</h1>
              <p className="text-sm text-slate-400 mt-1">Non quanto accumuli, ma come smobilizzi: due strategie di prelievo a confronto</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">PRELIEVO FISSO — ANNO DI ESAURIMENTO</div>
            <div className={"text-2xl sm:text-3xl font-bold tabular-nums " + (fisso.annoEsaurimento ? "text-rose-400" : "text-emerald-400")}>
              {fisso.annoEsaurimento ? `Anno ${fisso.annoEsaurimento}` : "mai (regge tutto l'orizzonte)"}
            </div>
            <div className="text-xs text-slate-500 mt-1">prelievo iniziale {eur(prelievoFissoAttuale)}/anno, indicizzato inflazione</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">PRELIEVO VARIABILE — CAPITALE RESIDUO</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">{eur(variabile.balanceFinale)}</div>
            <div className="text-xs text-slate-500 mt-1">a fine orizzonte, non si esaurisce mai per costruzione</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">PRELIEVO VARIABILE — REDDITO MEDIO ANNUO</div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-300 tabular-nums">{eur(variabile.prelievoMedio)}</div>
            <div className="text-xs text-slate-500 mt-1">ma fluttua con il mercato</div>
          </Card>
        </div>

        {fisso.annoEsaurimento && (
          <Card className="mb-6 border border-rose-500/40 bg-rose-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-rose-400" />
              <p className="text-xs text-slate-400">Con un prelievo fisso del {tassoFisso}% indicizzato all'inflazione, il capitale si esaurisce all'anno {fisso.annoEsaurimento} su un orizzonte di {anni} anni. Il prelievo variabile, per costruzione, non esaurisce mai il capitale ma comporta un reddito annuo meno prevedibile.</p>
            </div>
          </Card>
        )}

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Parametri di prelievo</SectionTitle>
            <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"><RefreshCcw className="w-3.5 h-3.5" /> Ripristina</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-2">
            <SliderField label="Capitale alla pensione" value={capitaleIniziale} min={50000} max={3000000} step={10000} onChange={setCapitaleIniziale} suffix="€" />
            <SliderField label="Orizzonte di decumulo" value={anni} min={10} max={30} step={1} onChange={setAnni} suffix="anni" />
            <SliderField label="Inflazione annua" value={inflazione} min={0} max={8} step={0.1} onChange={setInflazione} suffix="% (indicizza il prelievo fisso)" />
            <SliderField label="Tasso di prelievo fisso iniziale" value={tassoFisso} min={1} max={10} step={0.1} onChange={setTassoFisso} accent="rose" suffix="% del capitale iniziale" />
            <SliderField label="Tasso di prelievo variabile" value={tassoVariabile} min={1} max={10} step={0.1} onChange={setTassoVariabile} accent="emerald" suffix="% del capitale corrente ogni anno" />
          </div>
        </Card>

        <Card className="mb-5">
          <SectionTitle icon={TrendingDown}>Capitale residuo nel tempo</SectionTitle>
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="anno" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis width={70} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => "€" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip {...tooltipStyle} formatter={(v) => eur(v)} labelFormatter={(y) => `Anno ${y}`} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Line type="monotone" dataKey="Prelievo fisso" stroke="#fb7185" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Prelievo variabile" stroke="#34d399" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Table2}>Sequenza rendimenti in pensione (illustrativa, modificabile)</SectionTitle>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {sequence.map((v, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-500">A{i + 1}</span>
                <input type="number" step={0.5} value={v} onChange={(e) => updateReturn(i, Number(e.target.value))}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-md px-1.5 py-1 text-right text-xs font-medium text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-400" />
              </div>
            ))}
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">Burn Rate in Retirement · Simulazione interattiva a scopo puramente illustrativo · Tutti i valori sono modificabili</p>
      </div>
    </div>
  );
}
