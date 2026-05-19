import { useEffect, useState, useCallback } from "react";

export type ThemeChoice = "light" | "dark";
const STORAGE_KEY = "theme";

function readChoice(): ThemeChoice {
  if (typeof window === "undefined") return "light";
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark") return v;
  // Migrate legacy "system" by resolving once
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(choice: ThemeChoice) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", choice === "dark");
  document.documentElement.style.colorScheme = choice;
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>("light");

  useEffect(() => {
    setChoice(readChoice());
  }, []);

  useEffect(() => {
    apply(choice);
  }, [choice]);

  const setTheme = useCallback((next: ThemeChoice) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setChoice(next);
  }, []);

  return { theme: choice, setTheme };
}

// Inline script string to prevent FOUC — runs before React hydrates
export const themeBootstrapScript = `
(function(){try{
  var t = localStorage.getItem('theme');
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.classList.toggle('dark', t === 'dark');
  document.documentElement.style.colorScheme = t;
}catch(e){}})();
`;
