import "../tma-overrides.css";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { useTelegramWebApp } from "./hooks/useTelegramWebApp.ts";
import { SettingsProvider } from "./contexts/SettingsContext";
import "./index.css";

const RootApp = () => {
  // keep minimal Telegram init (ready/expand), theme + language come from SettingsProvider

  useTelegramWebApp();
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as Element | null;

      if (target?.closest("img, svg, picture")) {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, []);
  return (
    <App />
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SettingsProvider>
      <RootApp />
    </SettingsProvider>
  </StrictMode>,
);
