import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { initTelegramWebApp } from "@/hooks/useTelegramWebApp";

export type ThemeMode = "auto" | "light" | "dark";

type SettingsContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: "light" | "dark";
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

const THEME_KEY = "theme_mode";

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "auto") return mode;
  const tg = window.Telegram?.WebApp;
  const scheme = tg?.colorScheme;
  return scheme === "light" ? "light" : "dark";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    return saved === "light" || saved === "dark" || saved === "auto" ? saved : "auto";
  });

  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
  };

  // Apply document theme + Telegram chrome (like crypto-bot-contest)
  useEffect(() => {
    initTelegramWebApp();
    const tg = window.Telegram?.WebApp;

    const apply = () => {
      const resolved = resolveTheme(theme);
      const root = document.documentElement;

      // Tailwind darkMode: ["class"] support
      root.classList.toggle("dark", resolved === "dark");
      root.dataset.theme = resolved;

      // Telegram chrome colors (hard-coded to match your request)
      if (tg) {
        const header = resolved === "dark" ? "#1C1C1E" : "#F1F1F2";
        const bg = resolved === "dark" ? "#1C1C1E" : "#FFFFFF";
        const bottom = resolved === "dark" ? "#1E1E1E" : "#F1F1F2";

        tg.setHeaderColor?.(header);
        tg.setBackgroundColor?.(bg);
        // setBottomBarColor expects #RRGGBB; blur/transparency is CSS
        tg.setBottomBarColor?.(bottom);
      }
    };

    apply();

    // Re-apply on Telegram theme change (when mode=auto)
    const onThemeChanged = () => {
      if (theme === "auto") apply();
    };

    tg?.onEvent?.("themeChanged", onThemeChanged);
    return () => tg?.offEvent?.("themeChanged", onThemeChanged);
  }, [theme]);

  const value: SettingsContextValue = { theme, setTheme, resolvedTheme };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
