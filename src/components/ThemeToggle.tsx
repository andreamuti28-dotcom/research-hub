import { useTheme, type ThemeChoice } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";
import { useT } from "@/lib/i18n";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useT();
  const next: ThemeChoice = theme === "light" ? "dark" : "light";
  const currentLabel = t(theme === "light" ? "theme.light" : "theme.dark");
  const nextLabel = t(next === "light" ? "theme.light" : "theme.dark");

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={t("theme.label", currentLabel, nextLabel)}
      title={t("theme.title", currentLabel, nextLabel)}
      className="inline-flex items-center justify-center w-8 h-8 rounded-xs border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
    >
      {theme === "light" ? <Sun className="w-4 h-4" strokeWidth={2} /> : <Moon className="w-4 h-4" strokeWidth={2} />}
    </button>
  );
}
