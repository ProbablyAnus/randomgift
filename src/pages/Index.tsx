import { useState } from "react";
import TabBar, { TabType } from "@/components/TabBar";
import { GiftsPage } from "@/components/pages/GiftsPage";
import { LeaderboardPage } from "@/components/pages/LeaderboardPage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { AdaptivityProvider } from "@/hooks/useAdaptivity";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("gifts");

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
        <div className="content-area scroll-smooth scrollbar-hide pt-2">
          {renderPage()}
        </div>
        <TabBar value={activeTab} onChange={setActiveTab} />
      </div>
    </AdaptivityProvider>
  );
};

export default Index;
