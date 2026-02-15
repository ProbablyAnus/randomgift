export {};

declare global {
  type TelegramColorScheme = "light" | "dark";
  type TelegramWebAppEvent = "viewportChanged" | "themeChanged" | "theme_changed" | (string & {});
  type TelegramInvoiceStatus = "paid" | "cancelled" | "failed" | "pending";

  interface TelegramWebAppInsets {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }

  interface TelegramWebAppUser {
    id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  }

  interface TelegramWebAppInitDataUnsafe {
    user?: TelegramWebAppUser;
    [key: string]: unknown;
  }

  interface TelegramWebApp {
    themeParams?: Record<string, unknown>;
    colorScheme?: TelegramColorScheme;
    isExpanded?: boolean;
    version?: string;
    platform?: string;
    initData?: string;
    viewportHeight?: number;
    viewportStableHeight?: number;
    safeAreaInset?: TelegramWebAppInsets;
    contentSafeAreaInset?: TelegramWebAppInsets;
    initDataUnsafe?: TelegramWebAppInitDataUnsafe;
    isVersionAtLeast?: (version: string) => boolean;
    setHeaderColor?: (color: string) => void;
    setBackgroundColor?: (color: string) => void;
    setBottomBarColor?: (color: string) => void;
    onEvent?: (event: TelegramWebAppEvent, cb: () => void) => void;
    offEvent?: (event: TelegramWebAppEvent, cb: () => void) => void;
    openTelegramLink?: (url: string) => void;
    openLink?: (url: string) => void;
    openInvoice?: (url: string, cb?: (status: TelegramInvoiceStatus) => void) => void;
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
  }

  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
