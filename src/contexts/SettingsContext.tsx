import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { initTelegramWebApp } from "@/hooks/useTelegramWebApp";

export type ThemeMode = "auto" | "light" | "dark";

type TelegramThemeParams = Partial<{
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
  secondary_bg_color: string;
  header_bg_color: string;
  bottom_bar_bg_color: string;
  accent_text_color: string;
  section_bg_color: string;
  section_header_text_color: string;
  subtitle_text_color: string;
  destructive_text_color: string;
}>;

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

const DEFAULT_THEME = {
  light: {
    bg: "#FFFFFF",
    secondary: "#F1F1F2",
    text: "#000000",
    hint: "#8E8E93",
    link: "#007AFF",
    header: "#F1F1F2",
    bottom: "#F1F1F2",
    button: "#007AFF",
    buttonText: "#FFFFFF",
  },
  dark: {
    bg: "#1C1C1E",
    secondary: "#2C2C2E",
    text: "#FFFFFF",
    hint: "#8E8E93",
    link: "#007AFF",
    header: "#1E1E1E",
    bottom: "#1E1E1E",
    button: "#007AFF",
    buttonText: "#FFFFFF",
  },
};

const toRgba = (color: string, alpha: number) => {
  const value = color.trim();
  if (!value.startsWith("#")) return value;

  const hex = value.slice(1);
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

const getColor = (params: TelegramThemeParams | undefined, key: keyof TelegramThemeParams, fallback: string) => {
  const value = params?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
};

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
      const defaults = DEFAULT_THEME[resolved];
      const themeParams = tg?.themeParams as TelegramThemeParams | undefined;

      const bgColor = getColor(themeParams, "bg_color", defaults.bg);
      const textColor = getColor(themeParams, "text_color", defaults.text);
      const hintColor = getColor(themeParams, "hint_color", defaults.hint);
      const linkColor = getColor(themeParams, "link_color", defaults.link);
      const buttonColor = getColor(themeParams, "button_color", defaults.button);
      const buttonTextColor = getColor(themeParams, "button_text_color", defaults.buttonText);
      const secondaryBg = getColor(themeParams, "secondary_bg_color", defaults.secondary);
      const headerBg = getColor(themeParams, "header_bg_color", defaults.header);
      const bottomBarBg = getColor(themeParams, "bottom_bar_bg_color", defaults.bottom);
      const accentText = getColor(themeParams, "accent_text_color", linkColor);
      const sectionBg = getColor(themeParams, "section_bg_color", secondaryBg);
      const sectionHeaderText = getColor(themeParams, "section_header_text_color", textColor);
      const subtitleText = getColor(themeParams, "subtitle_text_color", hintColor);
      const destructiveText = getColor(themeParams, "destructive_text_color", "#FF3B30");

      // Tailwind darkMode: ["class"] support
      root.classList.toggle("dark", resolved === "dark");
      root.dataset.theme = resolved;

      root.style.setProperty("--tg-theme-bg-color", bgColor);
      root.style.setProperty("--tg-theme-text-color", textColor);
      root.style.setProperty("--tg-theme-hint-color", hintColor);
      root.style.setProperty("--tg-theme-link-color", linkColor);
      root.style.setProperty("--tg-theme-button-color", buttonColor);
      root.style.setProperty("--tg-theme-button-text-color", buttonTextColor);
      root.style.setProperty("--tg-theme-secondary-bg-color", secondaryBg);
      root.style.setProperty("--tg-theme-header-bg-color", headerBg);
      root.style.setProperty("--tg-theme-bottom-bar-bg-color", bottomBarBg);
      root.style.setProperty("--tg-theme-accent-text-color", accentText);
      root.style.setProperty("--tg-theme-section-bg-color", sectionBg);
      root.style.setProperty("--tg-theme-section-header-text-color", sectionHeaderText);
      root.style.setProperty("--tg-theme-subtitle-text-color", subtitleText);
      root.style.setProperty("--tg-theme-destructive-text-color", destructiveText);

      root.style.setProperty("--app-bg", bgColor);
      root.style.setProperty("--app-card", secondaryBg);
      root.style.setProperty("--tabbar-bg", toRgba(bottomBarBg, 0.75));
      root.style.setProperty("--tg-text", textColor);
      root.style.setProperty("--tg-button", buttonColor);
      root.style.setProperty("--tg-button-text", buttonTextColor);
      root.style.setProperty("--tg-hint", hintColor);
      root.style.setProperty("--tg-link", linkColor);
      root.style.setProperty("--tg-accent", accentText);
      root.style.setProperty("--tg-header-bg", headerBg);
      root.style.setProperty("--tg-bottom-bar-bg", bottomBarBg);
      root.style.setProperty("--tg-section-bg", sectionBg);
      root.style.setProperty("--tg-section-header-text", sectionHeaderText);
      root.style.setProperty("--tg-subtitle-text", subtitleText);
      root.style.setProperty("--tg-destructive-text", destructiveText);

      // Telegram chrome colors (aligned with theme params)
      if (tg) {
        const header = headerBg;
        const bg = bgColor;
        const bottom = bottomBarBg;

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
