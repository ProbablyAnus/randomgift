import { useEffect, useMemo, useState } from "react";
import { BottomNav, type TabType } from "@/components/BottomNav";
import { GiftsPage } from "@/components/pages/GiftsPage";
import { LeaderboardPage } from "@/components/pages/LeaderboardPage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { AdaptivityProvider } from "@/hooks/useAdaptivity";

const tabOrder: TabType[] = ["gifts", "leaderboard", "profile"];
const SWIPE_DURATION_MS = 360;

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("gifts");
  const [displayedTab, setDisplayedTab] = useState<TabType>("gifts");
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right">("left");

  useEffect(() => {
    if (activeTab === displayedTab) {
      return;
    }

    const fromIndex = tabOrder.indexOf(displayedTab);
    const toIndex = tabOrder.indexOf(activeTab);
    setSwipeDirection(toIndex > fromIndex ? "left" : "right");

    const timer = window.setTimeout(() => {
      setDisplayedTab(activeTab);
    }, SWIPE_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [activeTab, displayedTab]);

  const animationClass = useMemo(() => {
    if (activeTab === displayedTab) {
      return "tab-page tab-page--static";
    }

    return swipeDirection === "left"
      ? "tab-page tab-page--swipe-left"
      : "tab-page tab-page--swipe-right";
  }, [activeTab, displayedTab, swipeDirection]);

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
          <div className={animationClass}>{renderPage(activeTab)}</div>
        </div>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </AdaptivityProvider>
  );
};

export default Index;
