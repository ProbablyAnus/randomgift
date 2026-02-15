import { useEffect, useMemo, useState } from "react";
import { getTelegramWebApp } from "@/lib/telegram";

// Minimal Telegram WebApp integration (safe fallback for non-Telegram browsers).
// Theme + language are handled by SettingsProvider.

const setRootPxVar = (name: string, value: number | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) return;
  document.documentElement.style.setProperty(name, `${value}px`);
};

const applyInsets = (prefix: string, insets?: TelegramWebAppInsets) => {
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
    const webApp = getTelegramWebApp();
    webApp?.ready?.();
    webApp?.expand?.();
    applyViewportVars(webApp);
  } catch {
    // ignore
  }
};

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(() => getTelegramWebApp());

  useEffect(() => {
    if (webApp) return;

    const maxAttempts = 20;
    let attempts = 0;

    const attachWebApp = () => {
      const currentWebApp = getTelegramWebApp();
      attempts += 1;

      if (currentWebApp || attempts >= maxAttempts) {
        setWebApp(currentWebApp);
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
    initTelegramWebApp();
    applyViewportVars(webApp);

    const handleViewportChange = () => applyViewportVars(webApp);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        applyViewportVars(webApp);
      }
    };

    webApp?.onEvent?.("viewportChanged", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("focus", handleViewportChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.visualViewport?.addEventListener("resize", handleViewportChange);

    return () => {
      webApp?.offEvent?.("viewportChanged", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("focus", handleViewportChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
    };
  }, [webApp]);

  return useMemo(() => {
    return {
      webApp,
      colorScheme: webApp?.colorScheme ?? "dark",
      isExpanded: Boolean(webApp?.isExpanded),
      themeParams: webApp?.themeParams ?? {},
    };
  }, [webApp]);
};
