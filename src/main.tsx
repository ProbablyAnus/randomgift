import "../tma-overrides.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { useTelegramWebApp } from "./hooks/useTelegramWebApp.ts";
import { SettingsProvider } from "./contexts/SettingsContext";
import "./index.css";

const RootApp = () => {
  // keep minimal Telegram init (ready/expand), theme + language come from SettingsProvider

  useTelegramWebApp();
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
