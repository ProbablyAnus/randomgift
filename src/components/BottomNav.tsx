import { useEffect, useMemo, useState } from "react";
import GiftIcon from "@/assets/tabbar/Gift.svg";
import LeaderboardIcon from "@/assets/tabbar/Earth.svg";
import ProfileIcon from "@/assets/tabbar/Contacts.Fill.Circle.svg";

export type TabType = "gifts" | "leaderboard" | "profile";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

type TabItem = {
  id: TabType;
  label: string;
  iconSrc: string;
};

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs: TabItem[] = useMemo(
    () => [
      { id: "gifts", label: "Подарки", iconSrc: GiftIcon },
      { id: "leaderboard", label: "Рейтинг", iconSrc: LeaderboardIcon },
      { id: "profile", label: "Профиль", iconSrc: ProfileIcon },
    ],
    [],
  );

  const [current, setCurrent] = useState<TabType>(activeTab);

  useEffect(() => setCurrent(activeTab), [activeTab]);

  return (
    <div className="cbc-tabbar" role="navigation" aria-label="Bottom navigation">
      {tabs.map((t) => {
        const isActive = current === t.id;
        return (
          <button
            key={t.id}
            type="button"
            className="cbc-tabbar__item"
            data-active={isActive ? "" : undefined}
            onClick={() => {
              setCurrent(t.id);
              onTabChange(t.id);
            }}
          >
            <span className="cbc-tabbar__iconWrap" aria-hidden="true">
              <img src={t.iconSrc} alt="" />
            </span>
            <span className="cbc-tabbar__label">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};
