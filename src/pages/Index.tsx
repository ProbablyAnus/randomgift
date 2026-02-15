import { useEffect, useState } from "react";
import { BottomNav, type TabType } from "@/components/BottomNav";
import { GiftsPage } from "@/components/pages/GiftsPage";
import { LeaderboardPage, preloadLeaderboard } from "@/components/pages/LeaderboardPage";
import { OpenInTelegramPage } from "@/components/pages/OpenInTelegramPage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { useTelegramWebAppContext } from "@/contexts/TelegramWebAppContext";
import { AdaptivityProvider } from "@/hooks/useAdaptivity";
import bouquetSvg from "@/assets/gifts/bouquet.svg";
import cakeSvg from "@/assets/gifts/cake.svg";
import champagneSvg from "@/assets/gifts/champagne.svg";
import diamondSvg from "@/assets/gifts/diamond.svg";
import elkaSvg from "@/assets/gifts/elka.svg";
import giftBoxSvg from "@/assets/gifts/gift-box.svg";
import heartBoxSvg from "@/assets/gifts/heart-box.svg";
import newTeddySvg from "@/assets/gifts/newteddy.svg";
import ringSvg from "@/assets/gifts/ring.svg";
import rocketSvg from "@/assets/gifts/rocket.svg";
import roseSvg from "@/assets/gifts/rose.svg";
import teddyBearSvg from "@/assets/gifts/teddy-bear.svg";
import trophySvg from "@/assets/gifts/trophy.svg";

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

  useEffect(() => {
    if (!isTelegramContext) return;

    preloadLeaderboard(webApp?.initData).catch((error) => {
      console.warn("leaderboard prefetch failed", error);
    });

    preloadImages([
      heartBoxSvg,
      teddyBearSvg,
      giftBoxSvg,
      roseSvg,
      elkaSvg,
      newTeddySvg,
      cakeSvg,
      bouquetSvg,
      rocketSvg,
      champagneSvg,
      trophySvg,
      ringSvg,
      diamondSvg,
    ]);
  }, [isTelegramContext, webApp?.initData]);

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
        <div className="content-area scroll-smooth scrollbar-hide">{renderPage()}</div>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AdaptivityProvider>
  );
};

export default Index;
