import { FC, useMemo, useRef, useState } from "react";
import { PriceTabs } from "../PriceTabs";
import StarSvg from "@/assets/gifts/star-badge.svg";
import ButtonIcon from "@/assets/gifts/svg-image-1.svg";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";
import { useAdaptivity } from "@/hooks/useAdaptivity";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { buildApiUrl } from "@/lib/api";
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

const prices = [25, 50, 100];

type GiftIcon = { src: string };
type RouletteGift = { icon: GiftIcon; label: string; price: number; chance: number };
type WinPrize = { icon: GiftIcon; label: string; price: number; chance: string };
type InvoiceRequestResult =
  | { invoiceLink: string; errorMessage: null }
  | { invoiceLink: null; errorMessage: string };
type GiftId =
  | "heart-box"
  | "teddy-bear"
  | "gift-box"
  | "rose"
  | "elka"
  | "newteddy"
  | "cake"
  | "bouquet"
  | "rocket"
  | "champagne"
  | "trophy"
  | "ring"
  | "diamond";

type ChanceConfig = { weight: number; label: string };

const chanceBySelectedPrice: Record<number, Record<GiftId, ChanceConfig>> = {
  25: {
    "heart-box": { weight: 18, label: "18%" },
    "teddy-bear": { weight: 18, label: "18%" },
    "gift-box": { weight: 26, label: "26%" },
    rose: { weight: 26, label: "26%" },
    elka: { weight: 2, label: "2%" },
    newteddy: { weight: 2, label: "2%" },
    cake: { weight: 2, label: "2%" },
    bouquet: { weight: 2, label: "2%" },
    rocket: { weight: 2, label: "2%" },
    champagne: { weight: 2, label: "2%" },
    trophy: { weight: 0.33, label: "0.33%" },
    ring: { weight: 0.33, label: "0.33%" },
    diamond: { weight: 0.34, label: "0.34%" },
  },
  50: {
    "heart-box": { weight: 7, label: "7%" },
    "teddy-bear": { weight: 7, label: "7%" },
    "gift-box": { weight: 24, label: "24%" },
    rose: { weight: 24, label: "24%" },
    elka: { weight: 5.5, label: "5.5%" },
    newteddy: { weight: 5.5, label: "5.5%" },
    cake: { weight: 5.5, label: "5.5%" },
    bouquet: { weight: 5.5, label: "5.5%" },
    rocket: { weight: 5.5, label: "5.5%" },
    champagne: { weight: 5.5, label: "5.5%" },
    trophy: { weight: 1.33, label: "1.33%" },
    ring: { weight: 1.33, label: "1.33%" },
    diamond: { weight: 1.34, label: "1.34%" },
  },
  100: {
    "heart-box": { weight: 1, label: "1%" },
    "teddy-bear": { weight: 1, label: "1%" },
    "gift-box": { weight: 2, label: "2%" },
    rose: { weight: 2, label: "2%" },
    elka: { weight: 12, label: "12%" },
    newteddy: { weight: 12, label: "12%" },
    cake: { weight: 12, label: "12%" },
    bouquet: { weight: 12, label: "12%" },
    rocket: { weight: 12, label: "12%" },
    champagne: { weight: 12, label: "12%" },
    trophy: { weight: 6.67, label: "6.67%" },
    ring: { weight: 6.67, label: "6.67%" },
    diamond: { weight: 6.66, label: "6.66%" },
  },
};

const giftsCatalog: { id: GiftId; icon: string; label: string; price: number }[] = [
  { id: "heart-box", icon: heartBoxSvg, label: "Сердце", price: 15 },
  { id: "teddy-bear", icon: teddyBearSvg, label: "Медвежонок", price: 15 },
  { id: "gift-box", icon: giftBoxSvg, label: "Коробка", price: 25 },
  { id: "rose", icon: roseSvg, label: "Роза", price: 25 },
  { id: "elka", icon: elkaSvg, label: "Ёлка", price: 50 },
  { id: "newteddy", icon: newTeddySvg, label: "Мишка", price: 50 },
  { id: "cake", icon: cakeSvg, label: "Торт", price: 50 },
  { id: "bouquet", icon: bouquetSvg, label: "Букет", price: 50 },
  { id: "rocket", icon: rocketSvg, label: "Ракета", price: 50 },
  { id: "champagne", icon: champagneSvg, label: "Шампанское", price: 50 },
  { id: "trophy", icon: trophySvg, label: "Кубок", price: 100 },
  { id: "ring", icon: ringSvg, label: "Кольцо", price: 100 },
  { id: "diamond", icon: diamondSvg, label: "Алмаз", price: 100 },
];

// Create extended array for smooth roulette spinning
const createExtendedRoulette = (gifts: RouletteGift[]) => {
  const extended: RouletteGift[] = [];
  for (let i = 0; i < 10; i++) {
    extended.push(...gifts);
  }
  return extended;
};

const shuffleGifts = (gifts: RouletteGift[]) => {
  const copy = [...gifts];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Select winner based on chances
const selectWinnerByChance = (gifts: RouletteGift[]) => {
  const totalChance = gifts.reduce((sum, g) => sum + g.chance, 0);
  if (totalChance <= 0) return 0;
  const random = Math.random() * totalChance;
  let cumulative = 0;

  for (let i = 0; i < gifts.length; i++) {
    cumulative += gifts[i].chance;
    if (random <= cumulative) {
      return i;
    }
  }
  return 0;
};

export const GiftsPage: FC = () => {
  const { sizeX, platform } = useAdaptivity();
  const { webApp } = useTelegramWebApp();
  const [selectedPrice, setSelectedPrice] = useState(25);
  const [demoMode, setDemoMode] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<{ icon: GiftIcon; label: string; price: number } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const rouletteRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chanceMap = chanceBySelectedPrice[selectedPrice];

  const baseRouletteGifts = useMemo<RouletteGift[]>(
    () =>
      giftsCatalog.map((gift) => ({
        icon: { src: gift.icon },
        label: gift.label,
        price: gift.price,
        chance: chanceMap?.[gift.id]?.weight ?? 0,
      })),
    [chanceMap]
  );

  const rouletteGifts = useMemo<RouletteGift[]>(
    () => shuffleGifts(baseRouletteGifts),
    [baseRouletteGifts, selectedPrice]
  );

  const allWinPrizes = useMemo<WinPrize[]>(
    () =>
      giftsCatalog.map((gift) => ({
        icon: { src: gift.icon },
        label: gift.label,
        price: gift.price,
        chance: chanceMap?.[gift.id]?.label ?? "—",
      })),
    [chanceMap]
  );

  const extendedRoulette = useMemo(
    () => createExtendedRoulette(rouletteGifts),
    [rouletteGifts]
  );

  const baseCardWidth = sizeX === "compact" ? 140 : 160;
  const baseCardHeight = sizeX === "compact" ? 162 : 184;
  const rouletteCardWidth = baseCardWidth;
  const cardGap = 12;

  const showTelegramErrorPopup = (message: string) => {
    if (webApp?.showPopup) {
      webApp.showPopup({
        title: "Ошибка",
        message,
        buttons: [{ type: "ok" }],
      });
      return;
    }

    window.alert(message);
  };
  
  const startSpin = () => {
    if (isSpinning) return;

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    
    setIsSpinning(true);
    setWonPrize(null);
    setShowResult(false);
    
    // Select winner based on chances
    const winnerIndex = selectWinnerByChance(rouletteGifts);
    const winner = rouletteGifts[winnerIndex];
    
    // Calculate spin position
    const itemWidth = rouletteCardWidth + cardGap; // card width + gap
    const containerWidth = containerRef.current?.offsetWidth || 360;
    // Slightly bias to the right to match the in-app pointer positioning
    const centerOffset = (containerWidth / 2) - (rouletteCardWidth / 2) + 6;
    
    // Land on winner in the middle of extended array
    const targetIndex = (rouletteGifts.length * 5) + winnerIndex;
    const targetPosition = (targetIndex * itemWidth) - centerOffset;
    
    if (rouletteRef.current) {
      // Reset position instantly
      rouletteRef.current.style.transition = 'none';
      rouletteRef.current.style.transform = 'translateX(0)';
      
      // Force reflow
      void rouletteRef.current.offsetHeight;
      
      // Start spin animation with platform-specific easing
      const easing = platform === "ios" 
        ? 'cubic-bezier(0.25, 0.1, 0.25, 1)' 
        : 'cubic-bezier(0.15, 0.7, 0.4, 1)';
      
      requestAnimationFrame(() => {
        if (rouletteRef.current) {
          rouletteRef.current.style.transition = `transform 4s ${easing}`;
          rouletteRef.current.style.transform = `translateX(-${targetPosition}px)`;
        }
      });
    }

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(winner);
      setShowResult(true);
      
      // Haptic feedback on supported devices
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 100]);
      }
    }, 4000);
  };

  const requestInvoiceLink = async (amount: number): Promise<InvoiceRequestResult> => {
    const initData = webApp?.initData;
    if (!initData) {
      console.warn("initData missing: invoice cannot be created outside Telegram WebApp context");
      return {
        invoiceLink: null,
        errorMessage: "Не удалось создать счёт, попробуйте позже",
      };
    }

    try {
      const response = await fetch(buildApiUrl(`/api/invoice?amount=${amount}`), {
        method: "GET",
        headers: { "X-Telegram-Init-Data": initData },
      });

      if (!response.ok) {
        const isServerOrClientError = response.status >= 400 && response.status <= 599;
        if (isServerOrClientError) {
          return {
            invoiceLink: null,
            errorMessage: "Не удалось создать счёт, попробуйте позже",
          };
        }

        return {
          invoiceLink: null,
          errorMessage: "Не удалось создать счёт, попробуйте позже",
        };
      }

      const data = (await response.json()) as { invoice_link?: string };
      const invoiceLink = data.invoice_link;
      if (!invoiceLink) {
        return {
          invoiceLink: null,
          errorMessage: "Не удалось создать счёт, попробуйте позже",
        };
      }

      return { invoiceLink, errorMessage: null };
    } catch {
      return {
        invoiceLink: null,
        errorMessage: "Не удалось создать счёт, попробуйте позже",
      };
    }
  };

  const handleGetGift = async () => {
    if (isSpinning || isCreatingInvoice) return;

    if (demoMode) {
      startSpin();
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const { invoiceLink, errorMessage } = await requestInvoiceLink(selectedPrice);
      if (!invoiceLink || !webApp?.openInvoice) {
        showTelegramErrorPopup(errorMessage ?? "Не удалось создать счёт, попробуйте позже");
        return;
      }

      webApp.openInvoice(invoiceLink, (status) => {
        if (status === "paid") {
          startSpin();
        }
      });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const closeResultPanel = () => {
    setShowResult(false);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setWonPrize(null);
    }, 320);
  };

  const handleDisableDemo = () => {
    setDemoMode(false);
    closeResultPanel();
  };

  // Button text based on state
  const getButtonContent = () => {
    const contentKey = isSpinning || isCreatingInvoice ? "spinning" : demoMode ? "demo" : "gift";

    if (isSpinning || isCreatingInvoice) {
      return (
        <span key={contentKey} className="button-content">
          <RefreshCw size={26} className="animate-spin text-primary-foreground" />
        </span>
      );
    }

    if (demoMode) {
      return (
        <span key={contentKey} className="button-content text-primary-foreground font-semibold text-lg">
          Испытать удачу!
          <img src={ButtonIcon} alt="" className="button-price-icon" />
        </span>
      );
    }

    return (
      <span key={contentKey} className="button-content">
        <span className="text-lg">Получить подарок</span>
        <span className="button-price">
          <img src={ButtonIcon} alt="" className="button-price-icon" />
          <span className="text-lg font-semibold price-value">{selectedPrice}</span>
        </span>
      </span>
    );
  };

  return (
    <div className="flex-1 pb-6">
      <div className="pt-3 mb-8">
        <PriceTabs
          prices={prices}
          selectedPrice={selectedPrice}
          onSelect={setSelectedPrice}
        />
      </div>

      {/* Roulette Section */}
      <div className="relative mb-4">
        {/* Center Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
          {/* Top triangle */}
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "10px solid color-mix(in srgb, #007AFF 85%, transparent)",
              borderBottom: "0px solid transparent",
              filter: "drop-shadow(0 -2px 6px rgba(0,0,0,0.35))",
            }}
          />
          <div className="w-0.5 rounded-full gpu-accelerated" style={{ height: `${baseCardHeight}px`, background: "color-mix(in srgb, #007AFF 65%, transparent)" }} />
          {/* Bottom triangle */}
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "0px solid transparent",
              borderBottom: "10px solid color-mix(in srgb, #007AFF 85%, transparent)",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))",
            }}
          />
        </div>

        {/* Roulette Container */}
        <div 
          ref={containerRef}
          className="relative overflow-hidden"
          style={{ height: `${baseCardHeight + 18}px` }}
        >
          {/* Gradient overlays */}
          <div
            className="absolute left-0 top-0 bottom-0 w-14 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, var(--app-bg), transparent)" }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-14 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, var(--app-bg), transparent)" }}
          />
          
          {/* Scrolling roulette */}
          <div
            ref={rouletteRef}
            className="flex h-full items-center gpu-accelerated"
            style={{ width: "fit-content", gap: `${cardGap}px` }}
          >
            {extendedRoulette.map((gift, index) => (
              <div
                key={index}
                className="flex-shrink-0 rounded-[12px] px-[10px] relative"
                style={{ 
                  width: rouletteCardWidth, 
                  height: baseCardHeight,
                  backgroundColor: "var(--app-card)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)"
                }}
              >
                {/* Centered icon - takes most of the space */}
                <div className="absolute inset-0 flex items-center justify-center pb-8">
                  <img src={gift.icon.src} alt={gift.label} className="gift-icon w-[100px] h-[100px] drop-shadow-lg" />
                </div>
                {/* Price badge centered at bottom */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 star-badge star-badge--center star-badge--tight">
                  <span className="price-row">
                    <img src={StarSvg} alt="Stars" className="star-icon" />
                    <span className="text-[15px] font-normal">{gift.price}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Win Result Overlay */}
        {wonPrize && (
          <div
            className={`win-result-overlay ${showResult ? "is-visible" : ""}`}
            role="dialog"
            aria-live="polite"
          >
            <div className="win-result-panel">
              <div className="win-result-content">
                <img src={wonPrize.icon.src} alt={wonPrize.label} className="gift-icon w-[120px] h-[120px] drop-shadow-xl" />
                <p className="text-foreground font-semibold text-2xl">Вы выиграли подарок!</p>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {demoMode
                    ? "Демо-режим нужен для тестирования шансов выпадения подарков."
                    : "Подарок уже отправлен на ваш аккаунт."}
                </p>
              </div>
              <div className="win-result-actions">
                {demoMode && (
                  <button
                    type="button"
                    className="win-result-primary-button touch-feedback"
                    onClick={handleDisableDemo}
                  >
                    Отключить демо-режим
                  </button>
                )}
                <button
                  type="button"
                  className="win-result-secondary-button touch-feedback"
                  onClick={closeResultPanel}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Demo Mode Toggle */}
      <div className="flex items-center justify-between px-4 pt-1 pb-4">
        <span className="text-foreground text-lg">Демо режим</span>
        <Switch checked={demoMode} onCheckedChange={setDemoMode} className="demo-switch" />
      </div>

      {/* Get Gift Button */}
      <div className="px-4 pb-3 mt-2">
        <button
          onClick={handleGetGift}
          disabled={isSpinning || isCreatingInvoice}
          className="primary-button touch-feedback"
        >
          {getButtonContent()}
        </button>
      </div>

      {/* Win Prizes Section - Horizontal Scroll */}
      <div className="pt-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2 px-4 font-medium">
          ВЫ МОЖЕТЕ ВЫИГРАТЬ
        </p>
        
        <div 
          className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide scroll-smooth px-4"
          style={{ 
            scrollSnapType: "x mandatory",
            scrollPaddingLeft: 16,
            scrollPaddingRight: 16,
          }}
        >
          {allWinPrizes.map((prize, index) => (
            <div
              key={index}
              className="win-prize-card flex-shrink-0 rounded-[12px] relative"
              style={{
                scrollSnapAlign: "start",
                width: baseCardWidth,
                height: baseCardHeight,
                backgroundColor: "var(--app-card)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)"
              }}
            >
              {/* Centered icon */}
              <div className="absolute inset-0 flex items-center justify-center pb-14">
                <img src={prize.icon.src} alt={prize.label} className="gift-icon w-[86px] h-[86px] drop-shadow-lg" />
              </div>
              {/* Price badge centered */}
              <div className="absolute bottom-7 left-1/2 -translate-x-1/2 star-badge star-badge--center star-badge--bottom">
                <span className="price-row">
                  <img src={StarSvg} alt="Stars" className="star-icon" />
                  <span className="text-[15px] font-normal">{prize.price}</span>
                </span>
              </div>
              {/* Chance at bottom center */}
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 chance-text">{prize.chance}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
