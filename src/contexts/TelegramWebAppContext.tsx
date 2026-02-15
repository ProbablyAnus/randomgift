import { createContext, ReactNode, useContext, useMemo } from "react";
import { TelegramWebApp, useTelegramWebApp } from "@/hooks/useTelegramWebApp";

type TelegramWebAppContextValue = {
  webApp: TelegramWebApp | null;
  isTelegramContext: boolean;
  colorScheme: "light" | "dark";
};

const TelegramWebAppContext = createContext<TelegramWebAppContextValue | null>(null);

export const TelegramWebAppProvider = ({ children }: { children: ReactNode }) => {
  const { webApp, colorScheme } = useTelegramWebApp();

  const value = useMemo<TelegramWebAppContextValue>(() => {
    return {
      webApp,
      colorScheme,
      isTelegramContext: Boolean(webApp),
    };
  }, [webApp, colorScheme]);

  // useTelegramWebApp must stay at the app root: duplicating it in child screens
  // re-subscribes Telegram/window listeners and can cause duplicate side effects.
  return <TelegramWebAppContext.Provider value={value}>{children}</TelegramWebAppContext.Provider>;
};

export const useTelegramWebAppContext = () => {
  const ctx = useContext(TelegramWebAppContext);
  if (!ctx) throw new Error("useTelegramWebAppContext must be used within TelegramWebAppProvider");
  return ctx;
};
