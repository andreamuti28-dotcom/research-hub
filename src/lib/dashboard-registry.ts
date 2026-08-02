// Registry of interactive dashboards available in the app.
// component_key stored in DB maps to a route path here.

export const DASHBOARD_REGISTRY: Record<
  string,
  { path: string; defaultTitle: string; defaultTitleEn: string }
> = {
  mutuo: {
    path: "/mutuo",
    defaultTitle: "Simulazione Mutuo",
    defaultTitleEn: "Mortgage Simulation",
  },
  "interesse-composto": {
    path: "/interesse-composto",
    defaultTitle: "Interesse Semplice vs Composto",
    defaultTitleEn: "Simple vs Compound Interest",
  },
  "efficienza-fiscale": {
    path: "/efficienza-fiscale",
    defaultTitle: "Efficienza Fiscale dei Capitali",
    defaultTitleEn: "Capital Tax Efficiency",
  },
  "stress-test": {
    path: "/stress-test",
    defaultTitle: "Stress Test di Portafoglio",
    defaultTitleEn: "Portfolio Stress Test",
  },
  ribilanciamento: {
    path: "/ribilanciamento",
    defaultTitle: "Ribilanciamento e Drift di Portafoglio",
    defaultTitleEn: "Portfolio Rebalancing & Drift",
  },
  "rischio-sequenza": {
    path: "/rischio-sequenza",
    defaultTitle: "Rischio di Sequenza dei Rendimenti",
    defaultTitleEn: "Sequence of Returns Risk",
  },
  "dividend-yield": {
    path: "/dividend-yield",
    defaultTitle: "Dividend Yield on Cost e Crescita dei Dividendi",
    defaultTitleEn: "Dividend Yield on Cost & Growth",
  },
  "sostenibilita-debito": {
    path: "/sostenibilita-debito",
    defaultTitle: "Sostenibilità del Debito",
    defaultTitleEn: "Debt Service Coverage",
  },
  "beta-volatilita": {
    path: "/beta-volatilita",
    defaultTitle: "Beta e Volatilità del Portafoglio",
    defaultTitleEn: "Portfolio Beta & Volatility",
  },
  "rendimento-reale": {
    path: "/rendimento-reale",
    defaultTitle: "Rendimento Reale e Inflazione",
    defaultTitleEn: "Real Return & Inflation",
  },
  "twr-mwr": {
    path: "/twr-mwr",
    defaultTitle: "TWR vs MWR",
    defaultTitleEn: "TWR vs MWR",
  },
  "tracking-error": {
    path: "/tracking-error",
    defaultTitle: "Tracking Error e Information Ratio",
    defaultTitleEn: "Tracking Error & Information Ratio",
  },
  "costo-opportunita": {
    path: "/costo-opportunita",
    defaultTitle: "Costo Opportunità degli Investimenti",
    defaultTitleEn: "Opportunity Cost Simulator",
  },
  "max-drawdown": {
    path: "/max-drawdown",
    defaultTitle: "Massimo Drawdown Storico",
    defaultTitleEn: "Maximum Drawdown History",
  },
  "asset-location": {
    path: "/asset-location",
    defaultTitle: "Asset Location e Efficienza Fiscale",
    defaultTitleEn: "Asset Location Efficiency",
  },
  "burn-rate-pensione": {
    path: "/burn-rate-pensione",
    defaultTitle: "Burn Rate e Sostenibilità in Pensione",
    defaultTitleEn: "Retirement Burn Rate",
  },
};

export type DashboardKey = keyof typeof DASHBOARD_REGISTRY;

export function dashboardPath(key: string): string | null {
  return DASHBOARD_REGISTRY[key]?.path ?? null;
}
