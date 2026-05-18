import { useTheme, type ThemeChoice } from "@/hooks/use-theme";
import { Monitor, Moon, Sun } from "lucide-react";

const options: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Tema chiaro", Icon: Sun },
  { value: "system", label: "Tema automatico", Icon: Monitor },
  { value: "dark", label: "Tema scuro", Icon: Moon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Selettore tema"
      className="inline-flex items-center border border-border rounded-xs overflow-hidden"
    >
      {options.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`p-1.5 transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
