// @ts-nocheck
import React, { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Landmark, Settings2, TrendingUp, Table2, RefreshCcw } from "lucide-react";

const DEFAULT_INFLAZIONE = [2.1, 8.1, 5.9, 0.8, 1.2, 5.4, 6.0, 2.3, 1.9, 2.0, 2.2, 2.1, 2.0, 1.8, 2.1, 2.0, 1.9, 2.2, 2.0, 2.1];

const eur = (v) => (v < 0 ? "-€" : "€") + Math.abs(Math.round(v)).toLocaleString("it-IT");

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

export default function RealReturnDashboard() {
  const [capitaleIniziale, setCapitaleIniziale] = useState(100000);
  const [pmtAnnuo, setPmtAnnuo] = useState(3000);
  const [rendimentoNominale, setRendimentoNominale] = useState(6);
  const [anni, setAnni] = useState(20);
  const [inflazioneSerie, setInflazioneSerie] = useState(DEFAULT_INFLAZIONE);

  const sequence = useMemo(() => inflazioneSerie.slice(0, anni), [inflazioneSerie, anni]);
  const updateInflazione = (i, value) => setInflazioneSerie((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  const resetDefaults = () => { setCapitaleIniziale(100000); setPmtAnnuo(3000); setRendimentoNominale(6); setAnni(20); setInflazioneSerie(DEFAULT_INFLAZIONE); };

  const { yearly, nominaleFinale, realeFinale, inflazioneMedia } = useMemo(() => {
    let nominale = capitaleIniziale, cumInflazione = 1;
    const out = [{ anno: 0, nominale, reale: nominale }];
    sequence.forEach((infl, i) => {
      nominale += pmtAnnuo;
      nominale *= 1 + rendimentoNominale / 100;
      cumInflazione *= 1 + infl / 100;
      out.push({ anno: i + 1, nominale, reale: nominale / cumInflazione });
    });
    const media = sequence.reduce((a, b) => a + b, 0) / sequence.length;
    return { yearly: out, nominaleFinale: out[out.length - 1].nominale, realeFinale: out[out.length - 1].reale, inflazioneMedia: media };
  }, [capitaleIniziale, pmtAnnuo, rendimentoNominale, sequence]);

  const erosione = nominaleFinale - realeFinale;
  const erosionePct = nominaleFinale > 0 ? (erosione / nominaleFinale) * 100 : 0;
  const totaleInvestito = capitaleIniziale + pmtAnnuo * sequence.length;
  const cagrNominale = (Math.pow(nominaleFinale / capitaleIniziale, 1 / sequence.length) - 1) * 100;
  const cagrReale = (Math.pow(realeFinale / capitaleIniziale, 1 / sequence.length) - 1) * 100;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/40 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0"><Landmark className="w-5 h-5 text-slate-300" strokeWidth={1.75} /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Inflazione Corretta — Real Return</h1>
              <p className="text-sm text-slate-400 mt-1">Il tuo vero potere d'acquisto, non solo i numeri nominali che vedi sull'estratto conto</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">CAPITALE FINALE NOMINALE</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums">{eur(nominaleFinale)}</div>
            <div className="text-xs text-slate-500 mt-1">CAGR nominale {cagrNominale.toFixed(1)}%</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">CAPITALE FINALE REALE</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">{eur(realeFinale)}</div>
            <div className="text-xs text-slate-500 mt-1">CAGR reale {cagrReale.toFixed(1)}% · potere d'acquisto di oggi</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">EROSIONE DA INFLAZIONE</div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-400 tabular-nums">{eur(erosione)}</div>
            <div className="text-xs text-slate-500 mt-1">{erosionePct.toFixed(1)}% del valore nominale</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">INFLAZIONE MEDIA ANNUA</div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">{inflazioneMedia.toFixed(1)}%</div>
          </Card>
        </div>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Parametri</SectionTitle>
            <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"><RefreshCcw className="w-3.5 h-3.5" /> Ripristina</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <SliderField label="Capitale iniziale" value={capitaleIniziale} min={0} max={1000000} step={5000} onChange={setCapitaleIniziale} suffix="€" />
            <SliderField label="Versamento annuo" value={pmtAnnuo} min={0} max={30000} step={500} onChange={setPmtAnnuo} accent="emerald" suffix="€" />
            <SliderField label="Rendimento nominale" value={rendimentoNominale} min={0} max={15} step={0.1} onChange={setRendimentoNominale} accent="emerald" suffix="% annuo" />
            <SliderField label="Orizzonte" value={anni} min={5} max={20} step={1} onChange={setAnni} suffix="anni" />
          </div>
        </Card>

        <Card className="mb-5">
          <SectionTitle icon={TrendingUp}>Capitale nominale vs reale nel tempo</SectionTitle>
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearly} margin={{ top: 10, right: 20, left: 5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="anno" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false} />
                <YAxis width={70} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => "€" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip {...tooltipStyle} formatter={(v) => eur(v)} labelFormatter={(y) => `Anno ${y}`} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Line type="monotone" dataKey="nominale" name="Nominale" stroke="#64748b" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                <Line type="monotone" dataKey="reale" name="Reale (potere d'acquisto)" stroke="#34d399" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Table2}>Inflazione annua per anno (illustrativa, modificabile)</SectionTitle>
          <p className="text-xs text-slate-500 mb-3">Valori di esempio, non un indice IPC/CPI ufficiale verificato. Modifica ogni anno per costruire il tuo scenario.</p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {sequence.map((v, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-500">A{i + 1}</span>
                <div className="flex items-center bg-slate-950/60 border border-slate-800 rounded-md overflow-hidden">
                  <input type="number" step={0.1} value={v} onChange={(e) => updateInflazione(i, Number(e.target.value))}
                    className="w-full bg-transparent px-1.5 py-1 text-right text-xs font-medium text-slate-100 tabular-nums focus:outline-none" />
                  <span className="text-[9px] text-slate-500 pr-1">%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">Inflazione Corretta — Real Return · Simulazione interattiva a scopo puramente illustrativo · Tutti i valori sono modificabili</p>
      </div>
    </div>
  );
}
