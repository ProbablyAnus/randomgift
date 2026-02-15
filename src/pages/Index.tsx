import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { BottomNav, type TabType } from "@/components/BottomNav";
import { OpenInTelegramPage } from "@/components/pages/OpenInTelegramPage";
import { useTelegramWebAppContext } from "@/contexts/TelegramWebAppContext";
import { AdaptivityProvider } from "@/hooks/useAdaptivity";
import ButtonIconSvg from "@/assets/gifts/svg-image-1.svg";

const GiftsPage = lazy(() => import("@/components/pages/GiftsPage").then((module) => ({ default: module.GiftsPage })));
const LeaderboardPage = lazy(() =>
  import("@/components/pages/LeaderboardPage").then((module) => ({ default: module.LeaderboardPage }))
);
const ProfilePage = lazy(() => import("@/components/pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));

const preloadImages = (images: string[]) => {
  if (typeof Image === "undefined") return;
  images.forEach((src) => {
    const image = new Image();
    image.src = src;
  });
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("gifts");
  const { webApp, isTelegramContext } = useTelegramWebAppContext();
  const giftsPreloadedRef = useRef(false);

  useEffect(() => {
    if (!isTelegramContext) return;

    const preloadLeaderboard = async () => {
      try {
        const module = await import("@/components/pages/LeaderboardPage");
        await module.preloadLeaderboard(webApp?.initData);
      } catch (error) {
        console.warn("leaderboard prefetch failed", error);
      }
    };

    const timeoutId = window.setTimeout(() => {
      void preloadLeaderboard();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isTelegramContext, webApp?.initData]);

  useEffect(() => {
    if (!isTelegramContext || giftsPreloadedRef.current) return;

    const runPreload = async () => {
      if (giftsPreloadedRef.current) return;
      const { GIFT_IMAGE_SOURCES } = await import("@/components/gifts/constants");
      preloadImages([...GIFT_IMAGE_SOURCES, ButtonIconSvg]);
      giftsPreloadedRef.current = true;
    };

    if (activeTab === "gifts") {
      void runPreload();
      return;
    }

    let timeoutId: number | null = null;
    let idleId: number | null = null;

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => {
        void runPreload();
      }, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(() => {
        void runPreload();
      }, 1200);
    }

    return () => {
      if (idleId !== null) {
        window.cancelIdleCallback?.(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activeTab, isTelegramContext]);

  if (!isTelegramContext) {
    return <OpenInTelegramPage />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case "gifts":
        return <GiftsPage />;
      case "leaderboard":
        return <LeaderboardPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <GiftsPage />;
    }
  };

  return (
    <AdaptivityProvider>
      <div className="app-container">
        <div className="content-area scroll-smooth scrollbar-hide">
          <Suspense fallback={<div className="h-full w-full" />}>
            {renderPage()}
          </Suspense>
        </div>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AdaptivityProvider>
  );
};

export default Index;
