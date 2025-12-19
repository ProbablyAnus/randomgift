import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const getInitialTheme = (): Theme => {
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
    const params = tg.themeParams as Partial<{
      bg_color: string;
      header_bg_color: string;
      bottom_bar_bg_color: string;
    }> | undefined;
    const header = params?.header_bg_color ?? (theme === "dark" ? "#1E1E1E" : "#F1F1F2");
    const bg = params?.bg_color ?? (theme === "dark" ? "#1C1C1E" : "#FFFFFF");
    const bottom = params?.bottom_bar_bg_color ?? (theme === "dark" ? "#1E1E1E" : "#F1F1F2");
    tg.setHeaderColor?.(header);
    tg.setBackgroundColor?.(bg);
    tg.setBottomBarColor?.(bottom);
  }
};

export default function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));

  useEffect(() => {
    apply(theme);
  }, [theme]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.onEvent) return undefined;

    const syncTheme = () => {
      const scheme = tg.colorScheme;
      setThemeState(scheme === "dark" ? "dark" : "light");
    };

    tg.onEvent("themeChanged", syncTheme);
    return () => tg.offEvent?.("themeChanged", syncTheme);
  }, []);

  return { theme, setTheme, toggleTheme };
}
