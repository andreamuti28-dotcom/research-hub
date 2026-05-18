import { useTheme, type ThemeChoice } from "@/hooks/use-theme";
import { Monitor, Moon, Sun } from "lucide-react";

const order: ThemeChoice[] = ["light", "dark", "system"];
const labels: Record<ThemeChoice, string> = {
  light: "Chiaro",
  dark: "Scuro",
  system: "Auto",
};

function Icon({ theme }: { theme: ThemeChoice }) {
  const cls = "w-4 h-4";
  if (theme === "light") return <Sun className={cls} strokeWidth={2} />;
  if (theme === "dark") return <Moon className={cls} strokeWidth={2} />;
  return <Monitor className={cls} strokeWidth={2} />;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = order[(order.indexOf(theme) + 1) % order.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Tema: ${labels[theme]}. Clicca per passare a ${labels[next]}`}
      title={`Tema: ${labels[theme]} → ${labels[next]}`}
      className="inline-flex items-center justify-center w-8 h-8 rounded-xs border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
    >
      <Icon theme={theme} />
    </button>
  );
}
