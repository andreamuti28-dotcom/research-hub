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
};

export type DashboardKey = keyof typeof DASHBOARD_REGISTRY;

export function dashboardPath(key: string): string | null {
  return DASHBOARD_REGISTRY[key]?.path ?? null;
}
