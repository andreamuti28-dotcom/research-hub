// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Shuffle, Settings2, TrendingUp, Table2, RefreshCcw, Info,
} from "lucide-react";

/* ---------------------------------------------------------
   MODELLO
   Una stessa sequenza di rendimenti annuali (rendimento medio
   identico) viene riordinata in vari modi. Con versamenti
   periodici (PAC), l'ordine in cui i rendimenti si presentano
   cambia il capitale finale: è il "rischio di sequenza".
   Senza versamenti periodici (capitale unico, nessun PMT),
   l'ordine è matematicamente irrilevante, perché la
   moltiplicazione è commutativa — il grafico lo dimostra.
--------------------------------------------------------- */
const DEFAULT_RETURNS = [
  8.2, -3.1, 12.4, 5.6, -18.5, 21.3, 9.8, -1.2, 14.7, 2.3,
  -22.6, 26.1, 11.0, 4.4, -6.8, 15.9, 7.1, -9.4, 18.2, 3.6,
  10.5, -14.2, 19.6, 6.0, 1.8,
];

function mulberry32(seed) {
  let s = seed;
  return function () {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle(array, seed) {
  const rng = mulberry32(seed);
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function simulatePath(initial, annualContribution, returns) {
  let balance = initial;
  const yearly = [{ year: 0, value: balance }];
  returns.forEach((r, i) => {
    balance += annualContribution;
    balance *= 1 + r / 100;
    yearly.push({ year: i + 1, value: balance });
  });
  return yearly;
}

const eur = (v) =>
  (v < 0 ? "-€" : "€") + Math.abs(Math.round(v)).toLocaleString("it-IT", { maximumFractionDigits: 0 });

function Card({ children, className = "" }) {
  return (
    <div className={"rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " + className}>
      {children}
    </div>
  );
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
  const accentClass =
    accent === "emerald" ? "accent-emerald-400" : accent === "amber" ? "accent-amber-400" : accent === "rose" ? "accent-rose-400" : "accent-violet-400";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <input
          type="number" value={value} step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-0.5 text-right text-sm font-semibold text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-violet-400"
        />
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"w-full h-1.5 rounded-full bg-slate-800 " + accentClass}
      />
      {suffix && <span className="text-[11px] text-slate-500 -mt-1">{suffix}</span>}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { background: "#0b0f17", border: "1px solid #232a3b", borderRadius: 10, fontSize: 12, color: "#e6e9f0" },
  labelStyle: { color: "#94a3b8", marginBottom: 4 },
};

const SCENARIO_COLORS = {
  storico: "#a78bfa", invertito: "#fb7185", peggioriPrima: "#ef4444",
  miglioriPrima: "#34d399", mixA: "#38bdf8", mixB: "#fbbf24", mixC: "#f472b6",
};

/* ---------------------------------------------------------
   MAIN DASHBOARD
--------------------------------------------------------- */
export default function SequenceOfReturnsRisk() {
  const [capitaleIniziale, setCapitaleIniziale] = useState(10000);
  const [pacMensile, setPacMensile] = useState(300);
  const [anni, setAnni] = useState(20);
  const [returns, setReturns] = useState(DEFAULT_RETURNS);
  const [shuffleSeed, setShuffleSeed] = useState(1);

  const sequence = useMemo(() => returns.slice(0, anni), [returns, anni]);
  const contributoAnnuo = pacMensile * 12;

  const updateReturn = (idx, value) => {
    setReturns((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const resetDefaults = () => {
    setCapitaleIniziale(10000); setPacMensile(300); setAnni(20);
    setReturns(DEFAULT_RETURNS); setShuffleSeed(1);
  };

  const scenarios = useMemo(() => {
    const defs = [
      { key: "storico", label: "Ordine storico (come inserito)", seq: sequence },
      { key: "invertito", label: "Ordine invertito", seq: [...sequence].reverse() },
      { key: "peggioriPrima", label: "Rendimenti peggiori prima", seq: [...sequence].sort((a, b) => a - b) },
      { key: "miglioriPrima", label: "Rendimenti migliori prima", seq: [...sequence].sort((a, b) => b - a) },
      { key: "mixA", label: "Sequenza mescolata A", seq: seededShuffle(sequence, shuffleSeed + 1) },
      { key: "mixB", label: "Sequenza mescolata B", seq: seededShuffle(sequence, shuffleSeed + 2) },
      { key: "mixC", label: "Sequenza mescolata C", seq: seededShuffle(sequence, shuffleSeed + 3) },
    ];
    return defs.map((d) => {
      const yearly = simulatePath(capitaleIniziale, contributoAnnuo, d.seq);
      return { ...d, yearly, finalBalance: yearly[yearly.length - 1].value, color: SCENARIO_COLORS[d.key] };
    });
  }, [sequence, capitaleIniziale, contributoAnnuo, shuffleSeed]);

  const best = scenarios.reduce((a, b) => (b.finalBalance > a.finalBalance ? b : a), scenarios[0]);
  const worst = scenarios.reduce((a, b) => (b.finalBalance < a.finalBalance ? b : a), scenarios[0]);
  const spread = best.finalBalance - worst.finalBalance;
  const spreadPct = worst.finalBalance > 0 ? (spread / worst.finalBalance) * 100 : 0;

  const rendimentoMedio = sequence.length > 0 ? sequence.reduce((a, b) => a + b, 0) / sequence.length : 0;

  const totaleVersato = capitaleIniziale + contributoAnnuo * sequence.length;

  const chartData = useMemo(() => {
    const maxLen = Math.max(...scenarios.map((s) => s.yearly.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const row = { year: i };
      scenarios.forEach((s) => { row[s.key] = s.yearly[i]?.value; });
      return row;
    });
  }, [scenarios]);

  const noContributi = contributoAnnuo === 0;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* HEADER */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/25 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0">
              <Shuffle className="w-5 h-5 text-cyan-300" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rischio di Sequenza dei Rendimenti</h1>
              <p className="text-sm text-slate-400 mt-1">
                Stesso rendimento medio, ordine diverso: quanto cambia il tuo capitale finale
              </p>
            </div>
          </div>
        </div>

        {/* KPI ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">RENDIMENTO MEDIO ANNUO</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 tabular-nums">{rendimentoMedio.toFixed(1)}%</div>
            <div className="text-xs text-slate-500 mt-1">identico in tutti gli scenari</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">MIGLIOR SCENARIO</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">{eur(best.finalBalance)}</div>
            <div className="text-xs text-slate-500 mt-1">{best.label}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">PEGGIOR SCENARIO</div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-400 tabular-nums">{eur(worst.finalBalance)}</div>
            <div className="text-xs text-slate-500 mt-1">{worst.label}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">RANGE (BEST − WORST)</div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">{eur(spread)}</div>
            <div className="text-xs text-slate-500 mt-1">{spreadPct.toFixed(0)}% di scarto</div>
          </Card>
        </div>

        {/* INFO CALLOUT */}
        <Card className="mb-6 border border-cyan-500/30 bg-cyan-950/10">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 shrink-0 text-cyan-400" />
            <div>
              <div className="text-sm font-semibold text-slate-100">
                {noContributi
                  ? "Senza versamenti periodici, l'ordine dei rendimenti non conta"
                  : "Con versamenti periodici (PAC), l'ordine dei rendimenti conta eccome"}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {noContributi
                  ? "Su un capitale investito in un'unica soluzione, moltiplicare i rendimenti in ordine diverso dà sempre lo stesso risultato: prova ad aggiungere un versamento mensile per vedere il capitale finale divergere tra gli scenari."
                  : `Con ${eur(contributoAnnuo)} versati ogni anno, lo stesso rendimento medio del ${rendimentoMedio.toFixed(1)}% produce risultati finali molto diversi a seconda di quando arrivano i cali di mercato. Un crollo nei primi anni, quando il capitale investito è ancora piccolo, pesa meno di un crollo negli ultimi anni, quando il capitale accumulato è al massimo — la costanza dei versamenti resta comunque la variabile che puoi controllare.`}
              </p>
            </div>
          </div>
        </Card>

        {/* PARAMETERS */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Parametri piano di accumulo</SectionTitle>
            <div className="flex items-center gap-3">
              <button onClick={() => setShuffleSeed((s) => s + 10)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                <Shuffle className="w-3.5 h-3.5" /> Rimescola
              </button>
              <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                <RefreshCcw className="w-3.5 h-3.5" /> Ripristina
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-2">
            <SliderField label="Capitale iniziale" value={capitaleIniziale} min={0} max={200000} step={1000} onChange={setCapitaleIniziale} suffix="€" />
            <SliderField label="Versamento mensile (PAC)" value={pacMensile} min={0} max={3000} step={50} onChange={setPacMensile} accent="emerald" suffix="€ al mese" />
            <SliderField label="Orizzonte temporale" value={anni} min={5} max={25} step={1} onChange={setAnni} suffix="anni" />
          </div>
        </Card>

        {/* CHART */}
        <Card className="mb-5">
          <SectionTitle icon={TrendingUp}>Traiettorie per ordine di sequenza</SectionTitle>
          <div style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 5, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="year" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false}
                  interval={anni > 15 ? 1 : 0}
                  label={{ value: "Anni", position: "bottom", offset: 0, fill: "#64748b", fontSize: 12 }}
                />
                <YAxis width={70} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => "€" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip {...tooltipStyle} formatter={(v) => eur(v)} labelFormatter={(y) => `Anno ${y}`} />
                <Legend verticalAlign="top" height={50} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                {scenarios.map((s) => (
                  <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={s.key === "storico" ? 2.75 : 2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* RESULTS TABLE */}
          <Card>
            <SectionTitle icon={Table2}>Confronto tra scenari</SectionTitle>
            <div className="overflow-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900">
                  <tr className="text-left text-slate-400">
                    <th className="px-3 py-2 font-medium">Scenario</th>
                    <th className="px-3 py-2 font-medium text-right">Capitale finale</th>
                    <th className="px-3 py-2 font-medium text-right">vs Storico</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums text-slate-200">
                  {scenarios.map((s) => {
                    const diff = s.finalBalance - scenarios[0].finalBalance;
                    return (
                      <tr key={s.key} className="border-t border-slate-800/70">
                        <td className="px-3 py-2 flex items-center gap-2 text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />
                          {s.label}
                        </td>
                        <td className="px-3 py-2 text-right">{eur(s.finalBalance)}</td>
                        <td className="px-3 py-2 text-right" style={{ color: diff === 0 ? "#94a3b8" : diff > 0 ? "#34d399" : "#fb7185" }}>
                          {diff === 0 ? "—" : (diff > 0 ? "+" : "") + eur(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-3">Capitale versato totale: {eur(totaleVersato)} · rendimento medio annuo {rendimentoMedio.toFixed(1)}% in ogni scenario.</p>
          </Card>

          {/* EDITABLE RETURNS SEQUENCE */}
          <Card>
            <SectionTitle icon={Settings2}>Sequenza rendimenti annuali (illustrativa, modificabile)</SectionTitle>
            <p className="text-xs text-slate-500 mb-3">Valori di esempio, non rappresentano rendimenti reali di un indice specifico. Modifica ogni anno per costruire la tua sequenza.</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-72 overflow-auto pr-1">
              {sequence.map((r, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500">Anno {i + 1}</span>
                  <div className="flex items-center bg-slate-950/60 border border-slate-800 rounded-md overflow-hidden">
                    <input
                      type="number" step={0.1} value={r}
                      onChange={(e) => updateReturn(i, Number(e.target.value))}
                      className="w-full bg-transparent px-2 py-1 text-right text-xs font-medium text-slate-100 tabular-nums focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 pr-1.5">%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          Rischio di Sequenza dei Rendimenti · Simulazione interattiva a scopo puramente illustrativo · Tutti i parametri sono modificabili
        </p>
      </div>
    </div>
  );
}
