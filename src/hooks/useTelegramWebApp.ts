import { useEffect, useMemo } from "react";

// Minimal Telegram WebApp integration (safe fallback for non-Telegram browsers).
// Theme + language are handled by SettingsProvider.

export type TelegramThemeParams = Record<string, unknown>;
export type TelegramWebApp = {
  themeParams?: TelegramThemeParams;
  colorScheme?: "light" | "dark";
  isExpanded?: boolean;
  version?: string;
  platform?: string;
  initData?: string;
  isVersionAtLeast?: (version: string) => boolean;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
  openInvoice?: (url: string, cb?: (status: "paid" | "cancelled" | "failed" | "pending") => void) => void;
  expand?: () => void;
  ready?: () => void;
};

export const initTelegramWebApp = () => {
  const root = document.documentElement;

  // Keep safe-area vars for iOS.
  // Telegram sets env(safe-area-inset-bottom) in some cases; we mirror it for CSS usage.
  root.style.setProperty("--safe-area-bottom", "env(safe-area-inset-bottom, 0px)");

  try {
    const wa: TelegramWebApp | undefined = (window as any)?.Telegram?.WebApp;
    wa?.ready?.();
    wa?.expand?.();
  } catch {
    // ignore
  }
};

export const useTelegramWebApp = () => {
  const webApp = useMemo<TelegramWebApp | null>(() => {
    return ((window as any)?.Telegram?.WebApp as TelegramWebApp) ?? null;
  }, []);

  useEffect(() => {
    initTelegramWebApp();
  }, []);

  return useMemo(() => {
    return {
      webApp,
      colorScheme: (webApp?.colorScheme as "light" | "dark" | undefined) ?? "dark",
      isExpanded: Boolean(webApp?.isExpanded),
      themeParams: webApp?.themeParams ?? {},
    };
  }, [webApp]);
};
