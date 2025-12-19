import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  const scheme = window.Telegram?.WebApp?.colorScheme;
  return scheme === "dark" ? "dark" : "light";
};

const apply = (theme: Theme) => {
  const root = document.documentElement;

  // Tailwind darkMode: ["class"]
  root.classList.toggle("dark", theme === "dark");

  // For CSS selectors (crypto-bot-contest uses dataset.light/dark)
  if (theme === "dark") {
    root.dataset.dark = "1";
    delete (root.dataset as any).light;
    root.dataset.theme = "dark";
  } else {
    root.dataset.light = "1";
    delete (root.dataset as any).dark;
    root.dataset.theme = "light";
  }

  // Telegram chrome colors
  const tg = window.Telegram?.WebApp;
  if (tg) {
    if (theme === "dark") {
      tg.setHeaderColor?.("#1C1C1E");
      tg.setBackgroundColor?.("#1C1C1E");
      tg.setBottomBarColor?.("#1E1E1E");
    } else {
      tg.setHeaderColor?.("#F1F1F2");
      tg.setBackgroundColor?.("#FFFFFF");
      tg.setBottomBarColor?.("#F1F1F2");
    }
  }
};

export default function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    apply(theme);
  }, [theme]);

  return { theme, setTheme, toggleTheme };
}
