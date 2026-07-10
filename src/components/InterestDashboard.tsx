// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Euro, Settings2, TrendingUp, Table2, Layers, RefreshCcw,
} from "lucide-react";

/* ---------------------------------------------------------
   FINANCIAL ENGINE
   - Interesse semplice: solo il capitale iniziale genera interesse
     (I = P0 · r · t); i versamenti aggiuntivi si sommano senza
     produrre ulteriore rendimento — mostra il costo-opportunità
     del non investire i risparmi periodici.
   - Interesse composto: simulazione mese per mese, con interesse
     e versamenti applicati secondo le periodicità scelte.
--------------------------------------------------------- */
function simulate(principal, years, ratePct, pmt, pmtFreq, compFreq) {
  const totalMonths = years * 12;
  const annualRate = ratePct / 100;
  let balanceCompound = principal;
  let cumulativeContrib = 0;
  const yearly = [{ year: 0, versato: principal, semplice: principal, composto: principal }];

  for (let m = 1; m <= totalMonths; m++) {
    const isPmtMonth = pmtFreq === 12 ? true : m % 12 === 0;
    if (isPmtMonth) {
      balanceCompound += pmt;
      cumulativeContrib += pmt;
    }
    const isCompMonth = compFreq === 12 ? true : m % 12 === 0;
    if (isCompMonth) {
      const periodicRate = compFreq === 12 ? annualRate / 12 : annualRate;
      balanceCompound *= 1 + periodicRate;
    }
    if (m % 12 === 0) {
      const year = m / 12;
      const versato = principal + cumulativeContrib;
      const semplice = principal + principal * annualRate * year + cumulativeContrib;
      yearly.push({ year, versato, semplice, composto: balanceCompound });
    }
  }
  return yearly;
}

const eur = (v) =>
  "€" + Math.round(v).toLocaleString("it-IT", { maximumFractionDigits: 0 });

/* ---------------------------------------------------------
   SMALL UI PRIMITIVES (coerenti con la dashboard mutuo)
--------------------------------------------------------- */
function Card({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 sm:p-6 " +
        className
      }
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
      <h3 className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-400">
        {children}
      </h3>
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange, suffix = "", accent = "violet" }) {
  const accentClass =
    accent === "emerald" ? "accent-emerald-400" : accent === "rose" ? "accent-rose-400" : "accent-violet-400";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-0.5 text-right text-sm font-semibold text-slate-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-violet-400"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"w-full h-1.5 rounded-full bg-slate-800 " + accentClass}
      />
      {suffix && <span className="text-[11px] text-slate-500 -mt-1">{suffix}</span>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm font-medium text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "#0b0f17",
    border: "1px solid #232a3b",
    borderRadius: 10,
    fontSize: 12,
    color: "#e6e9f0",
  },
  labelStyle: { color: "#94a3b8", marginBottom: 4 },
};

/* ---------------------------------------------------------
   MAIN DASHBOARD
--------------------------------------------------------- */
export default function InterestDashboard() {
  const [principal, setPrincipal] = useState(25000);
  const [years, setYears] = useState(40);
  const [rate, setRate] = useState(4);
  const [pmt, setPmt] = useState(150);
  const [pmtFreq, setPmtFreq] = useState(12);
  const [compFreq, setCompFreq] = useState(12);

  const yearly = useMemo(
    () => simulate(principal, years, rate, pmt, pmtFreq, compFreq),
    [principal, years, rate, pmt, pmtFreq, compFreq]
  );

  const last = yearly[yearly.length - 1];
  const totaleVersamenti = last.versato - principal;
  const interesseSemplice = last.semplice - principal - totaleVersamenti;
  const interesseComposto = last.composto - principal - totaleVersamenti;
  const differenza = last.composto - last.semplice;

  const composizione = [
    { name: "Capitale iniziale", value: principal, fill: "#a78bfa" },
    { name: "Versamenti aggiuntivi", value: totaleVersamenti, fill: "#38bdf8" },
    { name: "Interessi maturati", value: interesseComposto, fill: "#34d399" },
  ];
  const totaleComposto = composizione.reduce((a, c) => a + c.value, 0);

  const resetDefaults = () => {
    setPrincipal(25000);
    setYears(40);
    setRate(4);
    setPmt(150);
    setPmtFreq(12);
    setCompFreq(12);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* HEADER */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-5 sm:p-8 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center shrink-0">
              <Euro className="w-5 h-5 text-emerald-300" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Interesse <span className="text-rose-400">semplice</span> vs <span className="text-emerald-400">composto</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Simulazione interattiva del risparmio nel tempo, completamente modificabile
              </p>
            </div>
          </div>
        </div>

        {/* KPI ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="text-xs text-slate-400 mb-2">CAPITALE FINALE — INTERESSE SEMPLICE</div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-400 tabular-nums">{eur(last.semplice)}</div>
            <div className="text-xs text-slate-500 mt-1">di cui interessi {eur(interesseSemplice)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">CAPITALE FINALE — INTERESSE COMPOSTO</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">{eur(last.composto)}</div>
            <div className="text-xs text-slate-500 mt-1">di cui interessi {eur(interesseComposto)}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400 mb-2">DIFFERENZA (COMPOSTO − SEMPLICE)</div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">{eur(differenza)}</div>
            <div className="text-xs text-slate-500 mt-1">vantaggio della capitalizzazione composta</div>
          </Card>
        </div>

        {/* PARAMETERS */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Settings2}>Parametri simulazione</SectionTitle>
            <button
              onClick={resetDefaults}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Ripristina
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
            <SliderField label="Deposito iniziale" value={principal} min={0} max={300000} step={500} onChange={setPrincipal} suffix="€" />
            <SliderField label="Durata" value={years} min={1} max={50} step={1} onChange={setYears} suffix="anni" />
            <SliderField label="Tasso di interesse annuale" value={rate} min={0} max={15} step={0.1} onChange={setRate} suffix="% annuo" />
            <SliderField label="Versamento aggiuntivo" value={pmt} min={0} max={3000} step={10} onChange={setPmt} accent="emerald" suffix="€ per periodo" />
            <SelectField
              label="Periodicità versamenti"
              value={pmtFreq}
              onChange={setPmtFreq}
              options={[{ value: 12, label: "Mensile" }, { value: 1, label: "Annuale" }]}
            />
            <SelectField
              label="Periodicità calcolo interessi"
              value={compFreq}
              onChange={setCompFreq}
              options={[{ value: 12, label: "Mensile" }, { value: 1, label: "Annuale" }]}
            />
          </div>
        </Card>

        {/* CHART */}
        <Card className="mb-5">
          <SectionTitle icon={TrendingUp}>Crescita del capitale nel tempo</SectionTitle>
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yearly} margin={{ top: 10, right: 20, left: 5, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                  interval={years > 20 ? Math.ceil(years / 10) - 1 : 0}
                  label={{ value: "Anni", position: "bottom", offset: 0, fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  width={70}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => "€" + (v / 1000).toFixed(0) + "k"}
                />
                <Tooltip {...tooltipStyle} formatter={(v) => eur(v)} labelFormatter={(y) => `Anno ${y}`} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Area type="monotone" dataKey="versato" name="Capitale versato" fill="#334155" stroke="#475569" strokeWidth={1.5} fillOpacity={0.5} />
                <Line type="monotone" dataKey="semplice" name="Montante — interesse semplice" stroke="#fb7185" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="composto" name="Montante — interesse composto" stroke="#34d399" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* RESULTS TABLE */}
          <Card>
            <SectionTitle icon={Table2}>Risultati</SectionTitle>
            <div className="overflow-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900">
                  <tr className="text-left text-slate-400">
                    <th className="px-3 py-2 font-medium">Voce</th>
                    <th className="px-3 py-2 font-medium text-right text-rose-300">Semplice</th>
                    <th className="px-3 py-2 font-medium text-right text-emerald-300">Composto</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums text-slate-200">
                  <tr className="border-t border-slate-800/70">
                    <td className="px-3 py-2 text-slate-400">Capitale iniziale</td>
                    <td className="px-3 py-2 text-right">{eur(principal)}</td>
                    <td className="px-3 py-2 text-right">{eur(principal)}</td>
                  </tr>
                  <tr className="border-t border-slate-800/70">
                    <td className="px-3 py-2 text-slate-400">Totale versamenti aggiuntivi</td>
                    <td className="px-3 py-2 text-right">{eur(totaleVersamenti)}</td>
                    <td className="px-3 py-2 text-right">{eur(totaleVersamenti)}</td>
                  </tr>
                  <tr className="border-t border-slate-800/70">
                    <td className="px-3 py-2 text-slate-400">Totale interessi</td>
                    <td className="px-3 py-2 text-right">{eur(interesseSemplice)}</td>
                    <td className="px-3 py-2 text-right">{eur(interesseComposto)}</td>
                  </tr>
                  <tr className="border-t border-slate-800/70 font-semibold">
                    <td className="px-3 py-2 text-slate-300">Capitale finale</td>
                    <td className="px-3 py-2 text-right text-rose-300">{eur(last.semplice)}</td>
                    <td className="px-3 py-2 text-right text-emerald-300">{eur(last.composto)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* COMPOSITION BREAKDOWN */}
          <Card>
            <SectionTitle icon={Layers}>Composizione del capitale finale (composto)</SectionTitle>
            <div className="flex flex-col gap-4 mt-2">
              {composizione.map((c) => {
                const pct = totaleComposto > 0 ? (c.value / totaleComposto) * 100 : 0;
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2 text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c.fill }} />
                        {c.name}
                      </span>
                      <span className="tabular-nums text-slate-400">{eur(c.value)} · {pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.fill }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-5">
              A parità di capitale versato, la quota di interessi maturati con la capitalizzazione composta cresce in modo non lineare nel tempo: più lungo è l'orizzonte, più marcato è il vantaggio rispetto all'interesse semplice.
            </p>
          </Card>
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          Dashboard Interesse Semplice vs Composto · Simulazione interattiva a scopo puramente illustrativo · Tutti i parametri sono modificabili
        </p>
      </div>
    </div>
  );
}
