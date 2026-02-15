import { FC } from "react";

const telegramAppUrl = import.meta.env.VITE_TELEGRAM_APP_URL ?? "";

export const OpenInTelegramPage: FC = () => {
  const handleOpen = () => {
    if (!telegramAppUrl) return;

    const openedWindow = window.open(telegramAppUrl, "_self");

    if (!openedWindow) {
      window.location.href = telegramAppUrl;
    }
  };

  return (
    <div className="app-container flex min-h-screen items-center justify-center p-6">
      <button
        type="button"
        onClick={handleOpen}
        disabled={!telegramAppUrl}
        className="w-full max-w-xs rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Открыть в Telegram
      </button>
    </div>
  );
};
