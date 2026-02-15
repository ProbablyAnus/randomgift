import { createContext, ReactNode, useContext, useMemo } from "react";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import type { TelegramWebApp } from "@/types/telegram";

type TelegramWebAppContextValue = {
  webApp: TelegramWebApp | null;
  isTelegramContext: boolean;
  colorScheme: "light" | "dark";
};

const TelegramWebAppContext = createContext<TelegramWebAppContextValue | null>(null);

export const TelegramWebAppProvider = ({ children }: { children: ReactNode }) => {
  const { webApp, colorScheme, isTelegramContext } = useTelegramWebApp();

  const value = useMemo<TelegramWebAppContextValue>(() => {
    return {
      webApp,
      colorScheme,
      isTelegramContext,
    };
  }, [webApp, colorScheme, isTelegramContext]);

  // useTelegramWebApp must stay at the app root: duplicating it in child screens
  // re-subscribes Telegram/window listeners and can cause duplicate side effects.
  return <TelegramWebAppContext.Provider value={value}>{children}</TelegramWebAppContext.Provider>;
};

export const useTelegramWebAppContext = () => {
  const ctx = useContext(TelegramWebAppContext);
  if (!ctx) throw new Error("useTelegramWebAppContext must be used within TelegramWebAppProvider");
  return ctx;
};

export const useRequiredTelegramWebApp = () => {
  const ctx = useTelegramWebAppContext();
  if (!ctx.isTelegramContext || !ctx.webApp || !ctx.webApp.initData) {
    throw new Error("useRequiredTelegramWebApp must be used inside Telegram WebApp context");
  }

  return ctx.webApp;
};
