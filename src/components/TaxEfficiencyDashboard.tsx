// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Percent, Settings2, TrendingUp, Table2, Landmark, RefreshCcw, Lightbulb,
} from "lucide-react";

/* ---------------------------------------------------------
   MODELLO
   - Lordo: crescita composta senza alcuna imposta (benchmark teorico).
   - Accumulazione: nessuna imposta annua sui proventi (reinvestiti
     internamente); un'unica imposta sulla plusvalenza al disinvestimento.
   - Distribuzione: la componente "cedolare/dividendo" è tassata ogni
     anno al momento della distribuzione (drag fiscale annuo), il
     dividendo netto viene reinvestito; la componente di apprezzamento
     del capitale resta tassata come plusvalenza solo all'uscita.
   - L'imposta di bollo (o tassa patrimoniale equivalente) si applica
     annualmente al valore di portafoglio in entrambi i casi.
--------------------------------------------------------- */
function simulateGross(principal, years, r, pmt) {
  let balance = principal;
  const yearly = [{ year: 0, value: principal }];
  for (let y = 1; y <= years; y++) {
    balance *= 1 + r / 100;
    balance += pmt;
    yearly.push({ year: y, value: balance });
  }
  return yearly;
}

function simulateAccumulo(principal, years, r, pmt, bollo) {
  let balance = principal, costBasis = principal;
  const yearly = [{ year: 0, value: principal }];
  for (let y = 1; y <= years; y++) {
    balance *= 1 + r / 100;
    balance += pmt; costBasis += pmt;
    balance *= 1 - bollo / 100;
    yearly.push({ year: y, value: balance });
  }
  return { yearly, finalBalance: balance, costBasis };
}

function simulateDistribuzione(principal, years, d, g, pmt, aliquotaDividendi, bollo) {
  let balance = principal, costBasis = principal, cumDividendTax = 0;
  const yearly = [{ year: 0, value: principal }];
  for (let y = 1; y <= years; y++) {
    const dividendGross = balance * (d / 100);
    const dividendTax = dividendGross * (aliquotaDividendi / 100);
    const dividendNet = dividendGross - dividendTax;
    cumDividendTax += dividendTax;
    const capApprec = balance * (g / 100);
    balance += capApprec + dividendNet;
    costBasis += dividendNet;
    balance += pmt; costBasis += pmt;
    balance *= 1 - bollo / 100;
    yearly.push({ year: y, value: balance });
  }
  return { yearly, finalBalance: balance, costBasis, cumDividendTax };
}

const eur = (v) =>
  (v < 0 ? "-€" : "€") + Math.abs(Math.round(v)).toLocaleString("it-IT", { maximumFractionDigits: 0 });

const PRESETS = {
  italia: { aliquotaDividendi: 26, aliquotaCapitalGain: 26, bollo: 0.2, label: "Italia (persona fisica)" },
  svizzera: { aliquotaDividendi: 35, aliquotaCapitalGain: 0, bollo: 0, label: "Svizzera (persona fisica)" },
};

/* ---------------------------------------------------------
   UI PRIMITIVES
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   MAIN DASHBOARD
--------------------------------------------------------- */
export default function TaxDragAnalysis() {
  const [capitale, setCapitale] = useState(50000);
  const [pmt, setPmt] = useState(0);
  const [anni, setAnni] = useState(20);
  const [rendimentoLordo, setRendimentoLordo] = useState(6);
  const [dividendYield, setDividendYield] = useState(2);
  const capApprecYield = Math.max(0, rendimentoLordo - dividendYield);

  const [aliquotaDividendi, setAliquotaDividendi] = useState(26);
  const [aliquotaCapitalGain, setAliquotaCapitalGain] = useState(26);
  const [bollo, setBollo] = useState(0.2);

  const applyPreset = (key) => {
    const p = PRESETS[key];
    setAliquotaDividendi(p.aliquotaDividendi);
    setAliquotaCapitalGain(p.aliquotaCapitalGain);
    setBollo(p.bollo);
  };

  const resetDefaults = () => {
    setCapitale(50000); setPmt(0); setAnni(20);
    setRendimentoLordo(6); setDividendYield(2);
    setAliquotaDividendi(26); setAliquotaCapitalGain(26); setBollo(0.2);
  };

  const gross = useMemo(() => simulateGross(capitale, anni, rendimentoLordo, pmt), [capitale, anni, rendimentoLordo, pmt]);
  const acc = useMemo(() => simulateAccumulo(capitale, anni, rendimentoLordo, pmt, bollo), [capitale, anni, rendimentoLordo, pmt, bollo]);
  const dist = useMemo(
    () => simulateDistribuzione(capitale, anni, dividendYield, capApprecYield, pmt, aliquotaDividendi, bollo),
    [capitale, anni, dividendYield, capApprecYield, pmt, aliquotaDividendi, bollo]
  );
  const accNoBollo = useMemo(() => simulateAccumulo(capitale, anni, rendimentoLordo, pmt, 0), [capitale, anni, rendimentoLordo, pmt]);
  const distNoBollo = useMemo(
    () => simulateDistribuzione(capitale, anni, dividendYield, capApprecYield, pmt, aliquotaDividendi, 0),
    [capitale, anni, dividendYield, capApprecYield, pmt, aliquotaDividendi]
  );

  const totaleInvestito = capitale + pmt * anni;
  const grossFinal = gross[gross.length - 1].value;

  const gainAcc = acc.finalBalance - acc.costBasis;
  const exitTaxAcc = Math.max(0, gainAcc * (aliquotaCapitalGain / 100));
  const netFinalAcc = acc.finalBalance - exitTaxAcc;
  const bolloCostAcc = accNoBollo.finalBalance - acc.finalBalance;

  const gainDist = dist.finalBalance - dist.costBasis;
  const exitTaxDist = Math.max(0, gainDist * (aliquotaCapitalGain / 100));
  const netFinalDist = dist.finalBalance - exitTaxDist;
  const bolloCostDist = distNoBollo.finalBalance - dist.finalBalance;

  const taxDragAcc = grossFinal - netFinalAcc;
  const taxDragDist = grossFinal - netFinalDist;
  const winner = netFinalAcc >= netFinalDist ? "accumulazione" : "distribuzione";
  const winnerGap = Math.abs(netFinalAcc - netFinalDist);

  const chartData = gross.map((g, i) => ({
    year: g.year,
    lordo: g.value,
    accumulazione: acc.yearly[i].value,
    distribuzione: dist.yearly[i].value,
  }));

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* HEADER */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/25 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5 text-amber-300" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Efficienza Fiscale dei Capitali</h1>
              <p className="text-sm text-slate-400 mt-1">
                Tax Drag Analysis — quanto le imposte erodono il rendimento nel tempo, simulazione modificabile
              </p>
            </div>
          </div>
        </div>

        {/* KPI ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">CAPITALE FINALE LORDO (SENZA IMPOSTE)</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-300 tabular-nums">{eur(grossFinal)}</div>
            <div className="text-xs text-slate-500 mt-1">benchmark teorico, {anni} anni</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">NETTO — ACCUMULAZIONE</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">{eur(netFinalAcc)}</div>
            <div className="text-xs text-slate-500 mt-1">tax drag {eur(taxDragAcc)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">NETTO — DISTRIBUZIONE</div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-400 tabular-nums">{eur(netFinalDist)}</div>
            <div className="text-xs text-slate-500 mt-1">tax drag {eur(taxDragDist)}</div>
          </Card>
        </div>

        {/* INSIGHT BANNER */}
        <Card className="mb-6 border border-amber-500/30 bg-amber-950/10">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 mt-0.5 shrink-0 text-amber-400" />
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Con questi parametri, uno strumento ad <span className="capitalize">{winner}</span> lascia in tasca {eur(winnerGap)} in più dopo {anni} anni
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Il vantaggio dell'accumulazione dipende dalla quota di rendimento distribuita come dividendo/cedola (qui {dividendYield}% su {rendimentoLordo}% totale) e cresce con l'orizzonte temporale: più a lungo l'imposta sui proventi resta differita, più tempo ha per generare a sua volta rendimento composto.
              </p>
            </div>
          </div>
        </Card>

        {/* PARAMETERS */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Parametri investimento</SectionTitle>
            <button onClick={resetDefaults} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
              <RefreshCcw className="w-3.5 h-3.5" /> Ripristina
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
            <SliderField label="Capitale investito" value={capitale} min={1000} max={1000000} step={1000} onChange={setCapitale} suffix="€" />
            <SliderField label="Versamento annuo aggiuntivo" value={pmt} min={0} max={50000} step={500} onChange={setPmt} suffix="€" />
            <SliderField label="Orizzonte temporale" value={anni} min={1} max={40} step={1} onChange={setAnni} suffix="anni" />
            <SliderField label="Rendimento lordo totale" value={rendimentoLordo} min={0} max={15} step={0.1} onChange={setRendimentoLordo} accent="emerald" suffix="% annuo" />
            <SliderField label="di cui dividendi / cedole" value={dividendYield} min={0} max={rendimentoLordo} step={0.1} onChange={setDividendYield} accent="rose" suffix="% annuo (distribuito se il fondo distribuisce)" />
          </div>
          <div className="text-xs text-slate-500 mb-5">
            Componente da apprezzamento del capitale (calcolata): <span className="text-slate-200 font-semibold">{capApprecYield.toFixed(1)}%</span> annuo
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Landmark className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">Regime fiscale</span>
            <div className="flex gap-2 ml-2">
              {Object.entries(PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-800 bg-slate-950/50 text-slate-400 hover:border-amber-400 hover:text-amber-200 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-3">
            <SliderField label="Aliquota su dividendi / cedole" value={aliquotaDividendi} min={0} max={45} step={0.5} onChange={setAliquotaDividendi} suffix="%" />
            <SliderField label="Aliquota su plusvalenza (capital gain)" value={aliquotaCapitalGain} min={0} max={45} step={0.5} onChange={setAliquotaCapitalGain} suffix="%" />
            <SliderField label="Imposta di bollo / patrimoniale" value={bollo} min={0} max={2} step={0.05} onChange={setBollo} accent="amber" suffix="% annuo sul valore" />
          </div>
        </Card>

        {/* CHART */}
        <Card className="mb-5">
          <SectionTitle icon={TrendingUp}>Capitale netto nel tempo</SectionTitle>
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 5, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="year" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickLine={false}
                  interval={anni > 20 ? Math.ceil(anni / 10) - 1 : 0}
                  label={{ value: "Anni", position: "bottom", offset: 0, fill: "#64748b", fontSize: 12 }}
                />
                <YAxis width={70} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => "€" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip {...tooltipStyle} formatter={(v) => eur(v)} labelFormatter={(y) => `Anno ${y}`} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Line type="monotone" dataKey="lordo" name="Lordo (senza imposte)" stroke="#64748b" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                <Line type="monotone" dataKey="accumulazione" name="Netto — Accumulazione" stroke="#34d399" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="distribuzione" name="Netto — Distribuzione" stroke="#fb7185" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* RESULTS TABLE */}
        <Card>
          <SectionTitle icon={Table2}>Dettaglio fiscale</SectionTitle>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-400">
                  <th className="px-3 py-2 font-medium">Voce</th>
                  <th className="px-3 py-2 font-medium text-right text-slate-300">Lordo</th>
                  <th className="px-3 py-2 font-medium text-right text-emerald-300">Accumulazione</th>
                  <th className="px-3 py-2 font-medium text-right text-rose-300">Distribuzione</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-slate-200">
                <tr className="border-t border-slate-800/70">
                  <td className="px-3 py-2 text-slate-400">Capitale investito totale</td>
                  <td className="px-3 py-2 text-right">{eur(totaleInvestito)}</td>
                  <td className="px-3 py-2 text-right">{eur(totaleInvestito)}</td>
                  <td className="px-3 py-2 text-right">{eur(totaleInvestito)}</td>
                </tr>
                <tr className="border-t border-slate-800/70">
                  <td className="px-3 py-2 text-slate-400">Rendimento lordo cumulato</td>
                  <td className="px-3 py-2 text-right">{eur(grossFinal - totaleInvestito)}</td>
                  <td className="px-3 py-2 text-right">—</td>
                  <td className="px-3 py-2 text-right">—</td>
                </tr>
                <tr className="border-t border-slate-800/70">
                  <td className="px-3 py-2 text-slate-400">Imposta di bollo cumulata (stima)</td>
                  <td className="px-3 py-2 text-right">—</td>
                  <td className="px-3 py-2 text-right">{eur(bolloCostAcc)}</td>
                  <td className="px-3 py-2 text-right">{eur(bolloCostDist)}</td>
                </tr>
                <tr className="border-t border-slate-800/70">
                  <td className="px-3 py-2 text-slate-400">Imposta su dividendi / cedole (annua)</td>
                  <td className="px-3 py-2 text-right">—</td>
                  <td className="px-3 py-2 text-right">€0</td>
                  <td className="px-3 py-2 text-right">{eur(dist.cumDividendTax)}</td>
                </tr>
                <tr className="border-t border-slate-800/70">
                  <td className="px-3 py-2 text-slate-400">Imposta su plusvalenza all'uscita</td>
                  <td className="px-3 py-2 text-right">—</td>
                  <td className="px-3 py-2 text-right">{eur(exitTaxAcc)}</td>
                  <td className="px-3 py-2 text-right">{eur(exitTaxDist)}</td>
                </tr>
                <tr className="border-t border-slate-700 font-semibold">
                  <td className="px-3 py-2 text-slate-200">Capitale finale netto</td>
                  <td className="px-3 py-2 text-right text-slate-300">{eur(grossFinal)}</td>
                  <td className="px-3 py-2 text-right text-emerald-300">{eur(netFinalAcc)}</td>
                  <td className="px-3 py-2 text-right text-rose-300">{eur(netFinalDist)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 text-slate-500 text-xs">Tax drag totale vs lordo</td>
                  <td className="px-3 py-1.5"></td>
                  <td className="px-3 py-1.5 text-right text-xs text-slate-400">{eur(taxDragAcc)}</td>
                  <td className="px-3 py-1.5 text-right text-xs text-slate-400">{eur(taxDragDist)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-8">
          Efficienza Fiscale dei Capitali · Simulazione interattiva a scopo puramente illustrativo, non costituisce consulenza fiscale · Tutti i parametri sono modificabili
        </p>
      </div>
    </div>
  );
}
