import { useEffect, useMemo, useRef, useState } from "react";

// Minimal Telegram WebApp integration (safe fallback for non-Telegram browsers).
// Theme + language are handled by SettingsProvider.

export type TelegramThemeParams = Record<string, unknown>;
type TelegramInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};
export type TelegramWebApp = {
  themeParams?: TelegramThemeParams;
  colorScheme?: "light" | "dark";
  isExpanded?: boolean;
  version?: string;
  platform?: string;
  initData?: string;
  viewportHeight?: number;
  viewportStableHeight?: number;
  safeAreaInset?: TelegramInsets;
  contentSafeAreaInset?: TelegramInsets;
  initDataUnsafe?: {
    user?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      photo_url?: string;
    };
  };
  isVersionAtLeast?: (version: string) => boolean;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  openInvoice?: (url: string, cb?: (status: "paid" | "cancelled" | "failed" | "pending") => void) => void;
  showPopup?: (
    params: {
      title?: string;
      message: string;
      buttons?: Array<{ id?: string; type?: "default" | "ok" | "close" | "cancel" | "destructive"; text?: string }>;
    },
    callback?: (buttonId: string) => void
  ) => void;
  expand?: () => void;
  ready?: () => void;
};

const hasValidInitData = (webApp: TelegramWebApp | null | undefined) => {
  return typeof webApp?.initData === "string" && webApp.initData.trim().length > 0;
};

const setRootPxVar = (name: string, value: number | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) return;
  document.documentElement.style.setProperty(name, `${value}px`);
};

const applyInsets = (prefix: string, insets?: TelegramInsets) => {
  if (!insets) return;
  setRootPxVar(`--${prefix}-top`, insets.top);
  setRootPxVar(`--${prefix}-bottom`, insets.bottom);
  setRootPxVar(`--${prefix}-left`, insets.left);
  setRootPxVar(`--${prefix}-right`, insets.right);
};

const applyViewportVars = (webApp?: TelegramWebApp | null) => {
  const fallbackHeight = window.visualViewport?.height ?? window.innerHeight;
  const fallbackWidth = window.visualViewport?.width ?? window.innerWidth;
  setRootPxVar("--tg-viewport-height", webApp?.viewportHeight ?? fallbackHeight);
  setRootPxVar("--tg-viewport-stable-height", webApp?.viewportStableHeight ?? fallbackHeight);
  setRootPxVar("--tg-viewport-width", fallbackWidth);
  applyInsets("tg-safe-area-inset", webApp?.safeAreaInset);
  applyInsets("tg-content-safe-area-inset", webApp?.contentSafeAreaInset);
};

export const initTelegramWebApp = () => {
  const root = document.documentElement;

  // Keep safe-area vars for iOS.
  // Telegram sets env(safe-area-inset-bottom) in some cases; we mirror it for CSS usage.
  root.style.setProperty("--safe-area-top", "env(safe-area-inset-top, 0px)");
  root.style.setProperty("--safe-area-bottom", "env(safe-area-inset-bottom, 0px)");
  root.style.setProperty("--safe-area-left", "env(safe-area-inset-left, 0px)");
  root.style.setProperty("--safe-area-right", "env(safe-area-inset-right, 0px)");

  try {
    const wa: TelegramWebApp | undefined = (window as any)?.Telegram?.WebApp;
    wa?.ready?.();
    wa?.expand?.();
    applyViewportVars(wa);
  } catch {
    // ignore
  }
};

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(() => {
    return ((window as any)?.Telegram?.WebApp as TelegramWebApp) ?? null;
  });
  const initializedRef = useRef(false);

  useEffect(() => {
    if (webApp) return;

    const maxAttempts = 20;
    let attempts = 0;

    const attachWebApp = () => {
      const wa = ((window as any)?.Telegram?.WebApp as TelegramWebApp) ?? null;
      attempts += 1;

      if (wa || attempts >= maxAttempts) {
        setWebApp(wa);
        return true;
      }

      return false;
    };

    if (attachWebApp()) return;

    const intervalId = window.setInterval(() => {
      if (attachWebApp()) {
        window.clearInterval(intervalId);
      }
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [webApp]);

  useEffect(() => {
    if (!initializedRef.current && webApp) {
      initTelegramWebApp();
      initializedRef.current = true;
    }

    applyViewportVars(webApp);
  }, [webApp]);

  useEffect(() => {
    const handleViewportChange = () => {
      const currentWebApp = ((window as any)?.Telegram?.WebApp as TelegramWebApp) ?? null;
      applyViewportVars(currentWebApp);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleViewportChange();
      }
    };

    handleViewportChange();
    const wa = ((window as any)?.Telegram?.WebApp as TelegramWebApp) ?? null;
    wa?.onEvent?.("viewportChanged", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("focus", handleViewportChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.visualViewport?.addEventListener("resize", handleViewportChange);

    return () => {
      wa?.offEvent?.("viewportChanged", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("focus", handleViewportChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
    };
  }, []);

  return useMemo(() => {
    const hasTelegramWebApp = Boolean((window as any)?.Telegram?.WebApp);

    return {
      webApp,
      isTelegramContext: hasTelegramWebApp && hasValidInitData(webApp),
      colorScheme: (webApp?.colorScheme as "light" | "dark" | undefined) ?? "dark",
      isExpanded: Boolean(webApp?.isExpanded),
      themeParams: webApp?.themeParams ?? {},
    };
  }, [webApp]);
};
