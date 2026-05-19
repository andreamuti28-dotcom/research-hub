import { useTheme, type ThemeChoice } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";

const labels: Record<ThemeChoice, string> = {
  light: "Chiaro",
  dark: "Scuro",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next: ThemeChoice = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Tema: ${labels[theme]}. Clicca per passare a ${labels[next]}`}
      title={`Tema: ${labels[theme]} → ${labels[next]}`}
      className="inline-flex items-center justify-center w-8 h-8 rounded-xs border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
    >
      {theme === "light" ? <Sun className="w-4 h-4" strokeWidth={2} /> : <Moon className="w-4 h-4" strokeWidth={2} />}
    </button>
  );
}
