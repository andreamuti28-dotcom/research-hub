// @ts-nocheck
import React, { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Layers, Settings2, Table2, RefreshCcw, Lightbulb } from "lucide-react";

const eur = (v) => (v < 0 ? "-€" : "€") + Math.abs(Math.round(v)).toLocaleString("it-IT");

function Card({ children, className = "" }) {
  return <div className={"rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " + className}>{children}</div>;
}
function SectionTitle({ icon: Icon, children }) {
  return <div className="flex items-center gap-2 mb-4"><Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} /><h3 className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-400">{children}</h3></div>;
}
function SliderField({ label, value, min, max, step, onChange, suffix = "", accent = "violet" }) {
  const accentClass = accent === "cyan" ? "accent-cyan-400" : accent === "amber" ? "accent-amber-400" : accent === "emerald" ? "accent-emerald-400" : "accent-violet-400";
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

const ASSET_DEFAULTS = [
  { key: "obbligazioni", label: "Obbligazioni", color: "#a78bfa", valore: 100000, yieldReddito: 4.5, yieldCapGain: 0.5 },
  { key: "azioni", label: "Azioni / ETF growth", color: "#22d3ee", valore: 150000, yieldReddito: 1.5, yieldCapGain: 6.0 },
  { key: "immobiliare", label: "REIT / Immobiliare", color: "#fbbf24", valore: 80000, yieldReddito: 5.0, yieldCapGain: 1.5 },
];

export default function AssetLocationDashboard() {
  const [assets, setAssets] = useState(ASSET_DEFAULTS);
  const [cap1, setCap1] = useState(120000);
  const [aliquotaReddito1, setAliquotaReddito1] = useState(0);
  const [aliquotaCapGain1, setAliquotaCapGain1] = useState(0);
  const [aliquotaReddito2, setAliquotaReddito2] = useState(26);
  const [aliquotaCapGain2, setAliquotaCapGain2] = useState(26);
  const [allocazioneAttuale, setAllocazioneAttuale] = useState({ obbligazioni: 30, azioni: 100, immobiliare: 0 });

  const updateAsset = (key, field, value) => setAssets((prev) => prev.map((a) => (a.key === key ? { ...a, [field]: value } : a)));
  const updateAlloc = (key, value) => setAllocazioneAttuale((prev) => ({ ...prev, [key]: value }));
  const resetDefaults = () => {
    setAssets(ASSET_DEFAULTS); setCap1(120000);
    setAliquotaReddito1(0); setAliquotaCapGain1(0); setAliquotaReddito2(26); setAliquotaCapGain2(26);
    setAllocazioneAttuale({ obbligazioni: 30, azioni: 100, immobiliare: 0 });
  };

  const taxCost = (valore, yReddito, yCapGain, aliqReddito, aliqCapGain) =>
    valore * (yReddito / 100) * (aliqReddito / 100) + valore * (yCapGain / 100) * (aliqCapGain / 100);

  // costo fiscale allocazione attuale
  const attuale = useMemo(() => {
    return assets.map((a) => {
      const pctC1 = allocazioneAttuale[a.key];
      const inC1 = a.valore * (pctC1 / 100);
      const inC2 = a.valore - inC1;
      const costo = taxCost(inC1, a.yieldReddito, a.yieldCapGain, aliquotaReddito1, aliquotaCapGain1) +
        taxCost(inC2, a.yieldReddito, a.yieldCapGain, aliquotaReddito2, aliquotaCapGain2);
      return { ...a, inC1, inC2, costo };
    });
  }, [assets, allocazioneAttuale, aliquotaReddito1, aliquotaCapGain1, aliquotaReddito2, aliquotaCapGain2]);
  const costoAttualeTotale = attuale.reduce((s, a) => s + a.costo, 0);

  // allocazione ottimale: greedy, priorità agli asset con maggior risparmio per euro nel contenitore 1
  const ottimale = useMemo(() => {
    const savingPerEuro = (a) => (a.yieldReddito / 100) * ((aliquotaReddito2 - aliquotaReddito1) / 100) + (a.yieldCapGain / 100) * ((aliquotaCapGain2 - aliquotaCapGain1) / 100);
    const sorted = [...assets].sort((a, b) => savingPerEuro(b) - savingPerEuro(a));
    let capacitaResidua = cap1;
    const placement = {};
    sorted.forEach((a) => {
      const inC1 = Math.max(0, Math.min(a.valore, capacitaResidua));
      placement[a.key] = inC1;
      capacitaResidua -= inC1;
    });
    return assets.map((a) => {
      const inC1 = placement[a.key];
      const inC2 = a.valore - inC1;
      const costo = taxCost(inC1, a.yieldReddito, a.yieldCapGain, aliquotaReddito1, aliquotaCapGain1) +
        taxCost(inC2, a.yieldReddito, a.yieldCapGain, aliquotaReddito2, aliquotaCapGain2);
      return { ...a, inC1, inC2, costo, pctC1: a.valore > 0 ? (inC1 / a.valore) * 100 : 0 };
    });
  }, [assets, cap1, aliquotaReddito1, aliquotaCapGain1, aliquotaReddito2, aliquotaCapGain2]);
  const costoOttimaleTotale = ottimale.reduce((s, a) => s + a.costo, 0);
  const risparmio = costoAttualeTotale - costoOttimaleTotale;

  const chartData = [
    { name: "Allocazione attuale", value: costoAttualeTotale, fill: "#fb7185" },
    { name: "Allocazione ottimale", value: costoOttimaleTotale, fill: "#34d399" },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/25 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0"><Layers className="w-5 h-5 text-emerald-300" strokeWidth={1.75} /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Asset Location Efficiency</h1>
              <p className="text-sm text-slate-400 mt-1">Dove tenere cosa: colloca ogni asset nel contenitore fiscalmente più adatto</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">COSTO FISCALE ANNUO ATTUALE</div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-400 tabular-nums">{eur(costoAttualeTotale)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">COSTO FISCALE ANNUO OTTIMALE</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">{eur(costoOttimaleTotale)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">RISPARMIO POTENZIALE ANNUO</div>
            <div className="text-2xl sm:text-3xl font-bold text-cyan-300 tabular-nums">{eur(risparmio)}</div>
          </Card>
        </div>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Contenitori e aliquote</SectionTitle>
            <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"><RefreshCcw className="w-3.5 h-3.5" /> Ripristina</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Contenitore 1 — fiscalmente efficiente (es. polizza, previdenza)</div>
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                <SliderField label="Capacità massima" value={cap1} min={0} max={500000} step={5000} onChange={setCap1} accent="emerald" suffix="€" />
                <SliderField label="Aliquota su reddito (dividendi/cedole)" value={aliquotaReddito1} min={0} max={45} step={0.5} onChange={setAliquotaReddito1} accent="emerald" suffix="%" />
                <SliderField label="Aliquota su plusvalenza" value={aliquotaCapGain1} min={0} max={45} step={0.5} onChange={setAliquotaCapGain1} accent="emerald" suffix="%" />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Contenitore 2 — standard (es. conto titoli ordinario)</div>
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                <SliderField label="Aliquota su reddito (dividendi/cedole)" value={aliquotaReddito2} min={0} max={45} step={0.5} onChange={setAliquotaReddito2} suffix="%" />
                <SliderField label="Aliquota su plusvalenza" value={aliquotaCapGain2} min={0} max={45} step={0.5} onChange={setAliquotaCapGain2} suffix="%" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <SectionTitle icon={Settings2}>Asset e allocazione attuale</SectionTitle>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-400">
                  <th className="px-3 py-2 font-medium">Asset</th>
                  <th className="px-3 py-2 font-medium text-right">Valore</th>
                  <th className="px-3 py-2 font-medium text-right">Reddito %</th>
                  <th className="px-3 py-2 font-medium text-right">Cap. gain %</th>
                  <th className="px-3 py-2 font-medium text-right">% in Contenitore 1 (attuale)</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-slate-200">
                {assets.map((a) => (
                  <tr key={a.key} className="border-t border-slate-800/70">
                    <td className="px-3 py-2 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: a.color }} />{a.label}</td>
                    <td className="px-3 py-1.5 text-right"><input type="number" step={1000} value={a.valore} onChange={(e) => updateAsset(a.key, "valore", Number(e.target.value))} className="w-24 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-right text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-400" /></td>
                    <td className="px-3 py-1.5 text-right"><input type="number" step={0.1} value={a.yieldReddito} onChange={(e) => updateAsset(a.key, "yieldReddito", Number(e.target.value))} className="w-16 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-right text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-400" /></td>
                    <td className="px-3 py-1.5 text-right"><input type="number" step={0.1} value={a.yieldCapGain} onChange={(e) => updateAsset(a.key, "yieldCapGain", Number(e.target.value))} className="w-16 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-right text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-400" /></td>
                    <td className="px-3 py-1.5 text-right"><input type="number" step={5} min={0} max={100} value={allocazioneAttuale[a.key]} onChange={(e) => updateAlloc(a.key, Number(e.target.value))} className="w-16 bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1 text-right text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="mb-6">
          <SectionTitle icon={Layers}>Costo fiscale: attuale vs ottimale</SectionTitle>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis width={70} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => "€" + v.toLocaleString("it-IT")} />
                <Tooltip {...tooltipStyle} formatter={(v) => eur(v)} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>{chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="mb-6 border border-emerald-500/30 bg-emerald-950/10">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 mt-0.5 shrink-0 text-emerald-400" />
            <p className="text-xs text-slate-400">Il piano ottimale riempie la capacità del Contenitore 1 partendo dagli asset con il maggior risparmio fiscale per euro investito — tipicamente quelli a più alto rendimento da reddito, dove il differenziale di aliquota pesa di più.</p>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Table2}>Piano di collocazione ottimale suggerito</SectionTitle>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-400">
                  <th className="px-3 py-2 font-medium">Asset</th>
                  <th className="px-3 py-2 font-medium text-right">In Contenitore 1</th>
                  <th className="px-3 py-2 font-medium text-right">In Contenitore 2</th>
                  <th className="px-3 py-2 font-medium text-right">Costo fiscale ottimale</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-slate-200">
                {ottimale.map((a) => (
                  <tr key={a.key} className="border-t border-slate-800/70">
                    <td className="px-3 py-2 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: a.color }} />{a.label}</td>
                    <td className="px-3 py-2 text-right text-emerald-300">{eur(a.inC1)}</td>
                    <td className="px-3 py-2 text-right text-slate-400">{eur(a.inC2)}</td>
                    <td className="px-3 py-2 text-right">{eur(a.costo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">Asset Location Efficiency · Simulazione interattiva a scopo puramente illustrativo, non costituisce consulenza fiscale · Tutti i valori sono modificabili</p>
      </div>
    </div>
  );
}
