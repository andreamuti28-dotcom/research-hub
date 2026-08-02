// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { Coins, Settings2, TrendingUp, Table2, RefreshCcw, Target } from "lucide-react";

const DEFAULT_DIVIDENDI = [1.0, 1.05, 1.12, 1.18, 1.27, 1.33, 1.42, 1.5];

const eur = (v) => "€" + Math.abs(v).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Card({ children, className = "" }) {
  return <div className={"rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " + className}>{children}</div>;
}
function SectionTitle({ icon: Icon, children }) {
  return <div className="flex items-center gap-2 mb-4"><Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} /><h3 className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-400">{children}</h3></div>;
}
function SliderField({ label, value, min, max, step, onChange, suffix = "", accent = "violet" }) {
  const accentClass = accent === "amber" ? "accent-amber-400" : accent === "emerald" ? "accent-emerald-400" : "accent-violet-400";
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

export default function DividendYieldDashboard() {
  const [prezzoAcquisto, setPrezzoAcquisto] = useState(25);
  const [dividendiStorici, setDividendiStorici] = useState(DEFAULT_DIVIDENDI);
  const [dgrProiettato, setDgrProiettato] = useState(null); // null = usa storico
  const [sogliaTarget, setSogliaTarget] = useState(6);
  const [orizzonte, setOrizzonte] = useState(20);

  const updateDividendo = (i, value) => setDividendiStorici((prev) => prev.map((d, idx) => (idx === i ? value : d)));
  const resetDefaults = () => { setPrezzoAcquisto(25); setDividendiStorici(DEFAULT_DIVIDENDI); setDgrProiettato(null); setSogliaTarget(6); setOrizzonte(20); };

  const n = dividendiStorici.length;
  const dgrStorico = n > 1 ? (Math.pow(dividendiStorici[n - 1] / dividendiStorici[0], 1 / (n - 1)) - 1) * 100 : 0;
  const dgrUsato = dgrProiettato !== null ? dgrProiettato : dgrStorico;

  const dividendoAttuale = dividendiStorici[n - 1];
  const yieldOnCostAttuale = (dividendoAttuale / prezzoAcquisto) * 100;

  const proiezione = useMemo(() => {
    const out = [];
    let dividendo = dividendoAttuale;
    for (let y = 0; y <= orizzonte; y++) {
      const yoc = (dividendo / prezzoAcquisto) * 100;
      out.push({ anno: y, dividendo, yoc });
      dividendo *= 1 + dgrUsato / 100;
    }
    return out;
  }, [dividendoAttuale, prezzoAcquisto, dgrUsato, orizzonte]);

  const annoTarget = proiezione.find((p) => p.yoc >= sogliaTarget)?.anno ?? null;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/25 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0"><Coins className="w-5 h-5 text-amber-300" strokeWidth={1.75} /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dividend Yield &amp; Growth</h1>
              <p className="text-sm text-slate-400 mt-1">Non solo il rendimento di oggi: proietta quando il tuo Yield on Cost raggiungerà l'obiettivo</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">YIELD ON COST ATTUALE</div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">{yieldOnCostAttuale.toFixed(2)}%</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">DGR STORICO (CAGR)</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums">{dgrStorico.toFixed(1)}%</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">DGR USATO IN PROIEZIONE</div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-300 tabular-nums">{dgrUsato.toFixed(1)}%</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">ANNO RAGGIUNGIMENTO TARGET</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">{annoTarget !== null ? `Anno ${annoTarget}` : "oltre l'orizzonte"}</div>
          </Card>
        </div>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Parametri</SectionTitle>
            <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"><RefreshCcw className="w-3.5 h-3.5" /> Ripristina</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-2">
            <SliderField label="Prezzo di acquisto" value={prezzoAcquisto} min={1} max={500} step={1} onChange={setPrezzoAcquisto} suffix="€ per azione/quota" />
            <SliderField label="DGR proiettato (override)" value={dgrProiettato ?? dgrStorico} min={-5} max={20} step={0.1} onChange={setDgrProiettato} accent="emerald" suffix="% annuo — regola per stress-testare" />
            <SliderField label="Soglia Yield on Cost target" value={sogliaTarget} min={1} max={15} step={0.1} onChange={setSogliaTarget} accent="amber" suffix="%" />
            <SliderField label="Orizzonte di proiezione" value={orizzonte} min={5} max={40} step={1} onChange={setOrizzonte} suffix="anni" />
          </div>
          {dgrProiettato !== null && (
            <button onClick={() => setDgrProiettato(null)} className="text-xs text-cyan-400 hover:text-cyan-300 underline">torna al DGR storico ({dgrStorico.toFixed(1)}%)</button>
          )}
        </Card>

        <Card className="mb-5">
          <SectionTitle icon={TrendingUp}>Proiezione Yield on Cost</SectionTitle>
          <div style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={proiezione} margin={{ top: 10, right: 20, left: 5, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="anno" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Anni da oggi", position: "bottom", offset: 0, fill: "#64748b", fontSize: 12 }} />
                <YAxis width={55} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(0) + "%"} />
                <Tooltip {...tooltipStyle} formatter={(v, name) => (name === "yoc" ? v.toFixed(2) + "%" : eur(v))} labelFormatter={(y) => `Anno ${y}`} />
                <ReferenceLine y={sogliaTarget} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Target ${sogliaTarget}%`, position: "right", fill: "#f59e0b", fontSize: 11 }} />
                <Line type="monotone" dataKey="yoc" name="Yield on Cost" stroke="#fbbf24" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Table2}>Storico dividendi (modificabile)</SectionTitle>
          <p className="text-xs text-slate-500 mb-3">Inserisci il dividendo annuo per azione/quota degli ultimi {n} anni per calcolare il DGR storico.</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
            {dividendiStorici.map((d, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500">Anno {i - n + 1 === 0 ? "attuale" : i - n + 1}</span>
                <div className="flex items-center bg-slate-950/60 border border-slate-800 rounded-md overflow-hidden">
                  <span className="text-[10px] text-slate-500 pl-1.5">€</span>
                  <input type="number" step={0.01} value={d} onChange={(e) => updateDividendo(i, Number(e.target.value))}
                    className="w-full bg-transparent px-1.5 py-1 text-right text-xs font-medium text-slate-100 tabular-nums focus:outline-none" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">Dividend Yield &amp; Growth · Simulazione interattiva a scopo puramente illustrativo · Tutti i valori sono modificabili</p>
      </div>
    </div>
  );
}
