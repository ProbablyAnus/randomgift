import { useEffect, useMemo, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import GiftAnimation from "@/assets/lottie/tab-gifts.json";
import LeaderboardAnimation from "@/assets/lottie/tab-leaderboard.json";
import ProfileAnimation from "@/assets/lottie/tab-profile.json";

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
  const recolorNode = (node: unknown) => {
    if (!node || typeof node !== "object") return;

    const shapeNode = node as {
      ty?: string;
      c?: {
        k?: number[] | unknown;
      };
      [key: string]: unknown;
    };

    if ((shapeNode.ty === "fl" || shapeNode.ty === "st") && Array.isArray(shapeNode.c?.k)) {
      shapeNode.c.k = target;
    }

    Object.values(shapeNode).forEach((value) => {
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
  const [activeColor, setActiveColor] = useState("#007AFF");
  const [inactiveColor, setInactiveColor] = useState("#959595");
  const lottieRefs = useRef<Array<LottieRefCurrentProps | null>>([]);

  useEffect(() => setCurrent(activeTab), [activeTab]);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const nextActive = styles.getPropertyValue("--tg-link").trim() || styles.getPropertyValue("--tg-button").trim();
    const nextInactive = styles.getPropertyValue("--tg-hint").trim();
    if (nextActive) setActiveColor(nextActive);
    if (nextInactive) setInactiveColor(nextInactive);
  }, []);

  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === current);
    const target = lottieRefs.current[activeIndex];
    target?.goToAndPlay?.(0, true);
  }, [current, tabs]);

  return (
    <div className="cbc-tabbar" role="navigation" aria-label="Bottom navigation">
      {tabs.map((tab, index) => {
        const isActive = current === tab.id;
        const animationData = recolorLottie(tab.animationData, isActive ? activeColor : inactiveColor);

        return (
          <button
            key={tab.id}
            type="button"
            className="cbc-tabbar__item"
            data-active={isActive ? "" : undefined}
            onClick={() => {
              setCurrent(tab.id);
              onTabChange(tab.id);
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
            <span className="cbc-tabbar__label">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
