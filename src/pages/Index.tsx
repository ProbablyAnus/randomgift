import { useState } from "react";
import { BottomNav, type TabType } from "@/components/BottomNav";
import { GiftsPage } from "@/components/pages/GiftsPage";
import { LeaderboardPage } from "@/components/pages/LeaderboardPage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { OpenInTelegramPage } from "@/components/pages/OpenInTelegramPage";
import { AdaptivityProvider } from "@/hooks/useAdaptivity";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";

const Index = () => {
  const { isTelegramContext } = useTelegramWebApp();
  const [activeTab, setActiveTab] = useState<TabType>("gifts");

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
          {renderPage()}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AdaptivityProvider>
  );
};

export default Index;
