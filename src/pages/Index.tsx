import { useEffect, useState } from "react";
import { BottomNav, type TabType } from "@/components/BottomNav";
import { GiftsPage } from "@/components/pages/GiftsPage";
import { LeaderboardPage } from "@/components/pages/LeaderboardPage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { AdaptivityProvider } from "@/hooks/useAdaptivity";

const PAGE_TRANSITION_MS = 300;

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("gifts");
  const [displayedTab, setDisplayedTab] = useState<TabType>("gifts");
  const [leavingTab, setLeavingTab] = useState<TabType | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (activeTab === displayedTab) return;

    const previousTab = displayedTab;
    setLeavingTab(previousTab);
    setDisplayedTab(activeTab);
    setIsTransitioning(true);

    const timer = window.setTimeout(() => {
      setLeavingTab(null);
      setIsTransitioning(false);
    }, PAGE_TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [activeTab, displayedTab]);

  const renderPage = (tab: TabType) => {
    switch (tab) {
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
        <div className="content-area scrollbar-hide">
          <div className="tab-page-layer tab-page-layer--enter">{renderPage(displayedTab)}</div>
          {isTransitioning && leavingTab && (
            <div className="tab-page-layer tab-page-layer--leave">{renderPage(leavingTab)}</div>
          )}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AdaptivityProvider>
  );
};

export default Index;
