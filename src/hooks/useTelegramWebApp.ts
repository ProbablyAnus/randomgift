import { useEffect, useMemo, useRef, useState } from "react";
import type {
  TelegramColorScheme,
  TelegramInsets,
  TelegramWebApp,
  TelegramWebAppInitDataUnsafe,
  TelegramWebAppUser,
} from "@/types/telegram";

// Minimal Telegram WebApp integration (safe fallback for non-Telegram browsers).
// Theme + language are handled by SettingsProvider.

type TelegramThemeParams = Record<string, unknown>;

const getTelegramWebApp = () => window.Telegram?.WebApp ?? null;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object";
};

export const isTelegramWebAppUser = (value: unknown): value is TelegramWebAppUser => {
  if (!isRecord(value)) return false;
  return typeof value.id === "number";
};

export const getTelegramInitDataUnsafe = (webApp: TelegramWebApp | null | undefined): TelegramWebAppInitDataUnsafe | null => {
  if (!isRecord(webApp?.initDataUnsafe)) return null;
  return webApp.initDataUnsafe;
};

export const getTelegramUser = (webApp: TelegramWebApp | null | undefined): TelegramWebAppUser | null => {
  const unsafeData = getTelegramInitDataUnsafe(webApp);
  if (!unsafeData || !isTelegramWebAppUser(unsafeData.user)) return null;
  return unsafeData.user;
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
    const wa = getTelegramWebApp();
    wa?.ready?.();
    wa?.expand?.();
    applyViewportVars(wa);
  } catch {
    // ignore
  }
};

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(() => {
    return getTelegramWebApp();
  });
  const initializedRef = useRef(false);

  useEffect(() => {
    if (webApp) return;

    const maxAttempts = 20;
    let attempts = 0;

    const attachWebApp = () => {
      const wa = getTelegramWebApp();
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
      const currentWebApp = getTelegramWebApp();
      applyViewportVars(currentWebApp);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleViewportChange();
      }
    };

    handleViewportChange();
    const wa = getTelegramWebApp();
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
    const hasTelegramWebApp = Boolean(getTelegramWebApp());
    const scheme: TelegramColorScheme = webApp?.colorScheme === "light" ? "light" : "dark";

    return {
      webApp,
      isTelegramContext: hasTelegramWebApp && hasValidInitData(webApp),
      colorScheme: scheme,
      isExpanded: Boolean(webApp?.isExpanded),
      themeParams: (webApp?.themeParams ?? {}) as TelegramThemeParams,
    };
  }, [webApp]);
};
