import "../tma-overrides.css";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { SettingsProvider } from "./contexts/SettingsContext";
import { TelegramWebAppProvider } from "./contexts/TelegramWebAppContext";
import "./index.css";

const RootApp = () => {
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
    <TelegramWebAppProvider>
      <SettingsProvider>
        <RootApp />
      </SettingsProvider>
    </TelegramWebAppProvider>
  </StrictMode>,
);
