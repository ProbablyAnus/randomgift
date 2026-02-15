const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isTelegramWebAppUser = (value: unknown): value is TelegramWebAppUser => {
  if (!isRecord(value)) return false;

  const { id } = value;
  return id === undefined || typeof id === "number";
};

export const isTelegramInitDataUnsafe = (value: unknown): value is TelegramWebAppInitDataUnsafe => {
  if (!isRecord(value)) return false;

  if (!("user" in value)) {
    return true;
  }

  return isTelegramWebAppUser(value.user);
};

export const getTelegramWebApp = (): TelegramWebApp | null => {
  return window.Telegram?.WebApp ?? null;
};

export const getTelegramUser = (webApp: TelegramWebApp | null | undefined): TelegramWebAppUser | null => {
  if (!webApp) return null;
  const { initDataUnsafe } = webApp;

  if (!isTelegramInitDataUnsafe(initDataUnsafe) || !initDataUnsafe.user) {
    return null;
  }

  return initDataUnsafe.user;
};
