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
};

export type DashboardKey = keyof typeof DASHBOARD_REGISTRY;

export function dashboardPath(key: string): string | null {
  return DASHBOARD_REGISTRY[key]?.path ?? null;
}
