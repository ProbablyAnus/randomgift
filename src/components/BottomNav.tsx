import { useEffect, useMemo, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import GiftAnimation from "@/assets/tabbar/tab-gifts.json";
import LeaderboardAnimation from "@/assets/tabbar/tab-leaderboard.json";
import ProfileAnimation from "@/assets/tabbar/tab-profile.json";

export type TabType = "gifts" | "leaderboard" | "profile";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

type TabItem = {
  id: TabType;
  label: string;
  animationData: object;
};

const hexToLottieColor = (hex: string) => {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized;
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return [r, g, b, 1];
};

const recolorLottie = (data: object, hex: string) => {
  const cloned = JSON.parse(JSON.stringify(data));
  const target = hexToLottieColor(hex);
  const recolorNode = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (node.ty === "fl" || node.ty === "st") {
      if (node.c?.k && Array.isArray(node.c.k)) {
        node.c.k = target;
      }
    }
    Object.values(node).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach(recolorNode);
      } else if (typeof value === "object") {
        recolorNode(value);
      }
    });
  };
  recolorNode(cloned);
  return cloned;
};

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs: TabItem[] = useMemo(
    () => [
      { id: "gifts", label: "Подарки", animationData: GiftAnimation },
      { id: "leaderboard", label: "Рейтинг", animationData: LeaderboardAnimation },
      { id: "profile", label: "Профиль", animationData: ProfileAnimation },
    ],
    [],
  );

  const [current, setCurrent] = useState<TabType>(activeTab);
  const lottieRefs = useRef<Array<LottieRefCurrentProps | null>>([]);

  useEffect(() => setCurrent(activeTab), [activeTab]);
  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === current);
    const target = lottieRefs.current[activeIndex];
    target?.goToAndPlay?.(0, true);
  }, [current, tabs]);

  return (
    <div className="cbc-tabbar" role="navigation" aria-label="Bottom navigation">
      {tabs.map((t, index) => {
        const isActive = current === t.id;
        const animationData = recolorLottie(t.animationData, isActive ? "#0080FA" : "#959595");
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
              <Lottie
                lottieRef={(ref) => {
                  lottieRefs.current[index] = ref;
                }}
                animationData={animationData}
                autoplay={false}
                loop={false}
                className="cbc-tabbar__lottie"
              />
            </span>
            <span className="cbc-tabbar__label">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};
