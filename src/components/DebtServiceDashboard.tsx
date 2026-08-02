// @ts-nocheck
import React, { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { PiggyBank, Settings2, Table2, RefreshCcw, Gauge } from "lucide-react";

const eur = (v) => (v < 0 ? "-€" : "€") + Math.abs(Math.round(v)).toLocaleString("it-IT");

function Card({ children, className = "" }) {
  return <div className={"rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " + className}>{children}</div>;
}
function SectionTitle({ icon: Icon, children }) {
  return <div className="flex items-center gap-2 mb-4"><Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} /><h3 className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-400">{children}</h3></div>;
}
function SliderField({ label, value, min, max, step, onChange, suffix = "", accent = "violet" }) {
  const accentClass = accent === "rose" ? "accent-rose-400" : accent === "emerald" ? "accent-emerald-400" : "accent-violet-400";
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

const DEBITI_DEFAULT = [
  { nome: "Mutuo casa", rata: 900 },
  { nome: "Prestito auto", rata: 200 },
  { nome: "Carta di credito / altro prestito", rata: 0 },
  { nome: "Altro", rata: 0 },
];

export default function DebtServiceDashboard() {
  const [redditoMensile, setRedditoMensile] = useState(3200);
  const [debiti, setDebiti] = useState(DEBITI_DEFAULT);
  const [soglia, setSoglia] = useState(30);
  const [nuovaRataIpotetica, setNuovaRataIpotetica] = useState(0);

  const updateDebito = (i, value) => setDebiti((prev) => prev.map((d, idx) => (idx === i ? { ...d, rata: value } : d)));
  const resetDefaults = () => { setRedditoMensile(3200); setDebiti(DEBITI_DEFAULT); setSoglia(30); setNuovaRataIpotetica(0); };

  const totaleRateAttuali = debiti.reduce((s, d) => s + d.rata, 0);
  const dtiAttuale = redditoMensile > 0 ? (totaleRateAttuali / redditoMensile) * 100 : 0;
  const totaleConNuova = totaleRateAttuali + nuovaRataIpotetica;
  const dtiConNuova = redditoMensile > 0 ? (totaleConNuova / redditoMensile) * 100 : 0;
  const redditoLibero = redditoMensile - totaleRateAttuali;
  const margineResiduo = Math.max(0, redditoMensile * (soglia / 100) - totaleRateAttuali);
  const superaSoglia = dtiAttuale > soglia;
  const nuovaSuperaSoglia = dtiConNuova > soglia;

  const barData = [
    { name: "Debito attuale", value: dtiAttuale, fill: superaSoglia ? "#fb7185" : "#34d399" },
    { name: "Con nuova rata ipotetica", value: dtiConNuova, fill: nuovaSuperaSoglia ? "#fb7185" : "#34d399" },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/25 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0"><PiggyBank className="w-5 h-5 text-rose-300" strokeWidth={1.75} /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Margine di Sicurezza del Debito</h1>
              <p className="text-sm text-slate-400 mt-1">Quanto del tuo reddito mensile va a coprire i debiti — e quanto margine hai prima del rischio</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">DEBT-TO-INCOME (DTI) ATTUALE</div>
            <div className={"text-2xl sm:text-3xl font-bold tabular-nums " + (superaSoglia ? "text-rose-400" : "text-emerald-400")}>{dtiAttuale.toFixed(1)}%</div>
            <div className="text-xs text-slate-500 mt-1">soglia di attenzione {soglia}%</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">MARGINE RESIDUO PRIMA DELLA SOGLIA</div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-300 tabular-nums">{eur(margineResiduo)}</div>
            <div className="text-xs text-slate-500 mt-1">di nuove rate mensili sostenibili</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">REDDITO LIBERO MENSILE</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums">{eur(redditoLibero)}</div>
          </Card>
        </div>

        <Card className={"mb-6 border " + (superaSoglia ? "border-rose-500/40 bg-rose-950/20" : "border-emerald-500/40 bg-emerald-950/20")}>
          <div className="flex items-start gap-3">
            <Gauge className={"w-5 h-5 mt-0.5 shrink-0 " + (superaSoglia ? "text-rose-400" : "text-emerald-400")} />
            <div>
              <div className="text-sm font-semibold text-slate-100">{superaSoglia ? `Il DTI supera la soglia del ${soglia}%` : `Il DTI è entro la soglia del ${soglia}%`}</div>
              <p className="text-xs text-slate-400 mt-1">
                {superaSoglia
                  ? "Il rischio finanziario legato al debito è elevato: prima di aprire nuovi investimenti o assumere ulteriore debito, valuta di destinare risorse aggiuntive all'abbattimento delle rate esistenti."
                  : "Il livello di indebitamento è sotto controllo rispetto al reddito. C'è margine per nuovi impegni finanziari, da valutare comunque con prudenza."}
              </p>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Reddito, debiti e soglia</SectionTitle>
            <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"><RefreshCcw className="w-3.5 h-3.5" /> Ripristina</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
            <SliderField label="Reddito mensile netto" value={redditoMensile} min={500} max={20000} step={100} onChange={setRedditoMensile} suffix="€" />
            <SliderField label="Soglia di attenzione DTI" value={soglia} min={10} max={50} step={1} onChange={setSoglia} accent="rose" suffix="%" />
            <SliderField label="Nuova rata ipotetica" value={nuovaRataIpotetica} min={0} max={3000} step={50} onChange={setNuovaRataIpotetica} accent="emerald" suffix="€/mese, per simulare un nuovo debito" />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Debiti attuali (rata mensile)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {debiti.map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2">
                <span className="text-sm text-slate-300">{d.nome}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">€</span>
                  <input type="number" step={50} value={d.rata} onChange={(e) => updateDebito(i, Number(e.target.value))}
                    className="w-24 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-right text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-rose-400" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Table2}>DTI attuale vs con nuova rata</SectionTitle>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis width={50} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v + "%"} />
                <Tooltip {...tooltipStyle} formatter={(v) => v.toFixed(1) + "%"} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>{barData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">Margine di Sicurezza del Debito · Simulazione interattiva a scopo puramente illustrativo · Tutti i valori sono modificabili</p>
      </div>
    </div>
  );
}
