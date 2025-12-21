import { FC, useState, useRef } from "react";
import { PriceTabs } from "../PriceTabs";
import StarSvg from "@/assets/gifts/star-badge.svg";
import ButtonIcon from "@/assets/gifts/svg-image-1.svg";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";
import { useAdaptivity } from "@/hooks/useAdaptivity";
import diamondPng from "@/assets/gifts/diamond.png";
import giftBoxPng from "@/assets/gifts/gift.png";
import heartBoxPng from "@/assets/gifts/heart.png";
import ringWebp from "@/assets/gifts/ring.webp";
import rosePng from "@/assets/gifts/rose.png";
import teddyBearWebp from "@/assets/gifts/teddy.webp";
import trophyPng from "@/assets/gifts/trophy.png";

const prices = [25, 50, 100];

type GiftIcon = { src: string; webp?: string };
type RouletteGift = { icon: GiftIcon; label: string; price: number; chance: number };
type WinPrize = { icon: GiftIcon; label: string; price: number; chance: string };

// Roulette gifts for spinning
const rouletteGifts: RouletteGift[] = [
  { icon: { src: heartBoxPng }, label: "Сердце", price: 15, chance: 27 },
  { icon: { src: trophyPng }, label: "Кубок", price: 100, chance: 6 },
  { icon: { src: giftBoxPng }, label: "Коробка", price: 25, chance: 17.5 },
  { icon: { src: teddyBearWebp }, label: "Медвежонок", price: 15, chance: 27 },
  { icon: { src: ringWebp }, label: "Кольцо", price: 100, chance: 6 },
  { icon: { src: rosePng }, label: "Роза", price: 25, chance: 17.5 },
];

// Win prizes for bottom section
const allWinPrizes: WinPrize[] = [
  { icon: { src: diamondPng }, label: "Алмаз", price: 100, chance: "1%" },
  { icon: { src: trophyPng }, label: "Кубок", price: 100, chance: "1%" },
  { icon: { src: ringWebp }, label: "Кольцо", price: 100, chance: "1%" },
  { icon: { src: heartBoxPng }, label: "Сердце", price: 15, chance: "27%" },
  { icon: { src: teddyBearWebp }, label: "Мишка", price: 15, chance: "27%" },
  { icon: { src: giftBoxPng }, label: "Коробка", price: 25, chance: "17.5%" },
  { icon: { src: rosePng }, label: "Роза", price: 25, chance: "17.5%" },
];

// Create extended array for smooth roulette spinning
const createExtendedRoulette = (gifts: RouletteGift[]) => {
  const extended: RouletteGift[] = [];
  for (let i = 0; i < 10; i++) {
    extended.push(...gifts);
  }
  return extended;
};

const extendedRoulette = createExtendedRoulette(rouletteGifts);

// Select winner based on chances
const selectWinnerByChance = () => {
  const totalChance = rouletteGifts.reduce((sum, g) => sum + g.chance, 0);
  const random = Math.random() * totalChance;
  let cumulative = 0;

  for (let i = 0; i < rouletteGifts.length; i++) {
    cumulative += rouletteGifts[i].chance;
    if (random <= cumulative) {
      return i;
    }
  }
  return 0;
};

export const GiftsPage: FC = () => {
  const { sizeX, platform } = useAdaptivity();
  const [selectedPrice, setSelectedPrice] = useState(25);
  const [demoMode, setDemoMode] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<{ icon: GiftIcon; label: string; price: number } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const rouletteRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const baseCardWidth = sizeX === "compact" ? 135 : 155;
  const baseCardHeight = sizeX === "compact" ? 156 : 176;
  const rouletteCardWidth = baseCardWidth;
  const cardGap = 12;
  
  const handleGetGift = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setWonPrize(null);
    setShowResult(false);
    
    // Select winner based on chances
    const winnerIndex = selectWinnerByChance();
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
      
      setTimeout(() => {
        setShowResult(false);
      }, 3000);
    }, 4000);
  };

  // Button text based on state
  const getButtonContent = () => {
    const contentKey = isSpinning ? "spinning" : demoMode ? "demo" : "gift";

    if (isSpinning) {
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
      <PriceTabs
        prices={prices}
        selectedPrice={selectedPrice}
        onSelect={setSelectedPrice}
      />

      {/* Roulette Section */}
      <div className="relative mb-3">
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
                className="flex-shrink-0 rounded-[12px] px-[10px] relative touch-feedback"
                style={{ 
                  width: rouletteCardWidth, 
                  height: baseCardHeight,
                  backgroundColor: "var(--app-card)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)"
                }}
              >
                {/* Centered icon - takes most of the space */}
                <div className="absolute inset-0 flex items-center justify-center pb-6">
                  <picture>
                    {gift.icon.webp && <source srcSet={gift.icon.webp} type="image/webp" />}
                    <img src={gift.icon.src} alt={gift.label} className="w-[98px] h-[98px] drop-shadow-lg" />
                  </picture>
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
        {showResult && wonPrize && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="bg-card/95 backdrop-blur-sm rounded-[12px] px-8 py-6 shadow-lg animate-scale-in border border-primary/30">
              <div className="flex flex-col items-center gap-3">
                <picture>
                  {wonPrize.icon.webp && <source srcSet={wonPrize.icon.webp} type="image/webp" />}
                  <img src={wonPrize.icon.src} alt={wonPrize.label} className="w-[92px] h-[92px] animate-bounce drop-shadow-xl" />
                </picture>
                <p className="text-foreground font-semibold text-xl">Вы выиграли!</p>
                <div className="star-badge">
                  <img src={StarSvg} alt="Stars" className="star-icon" />
                  {wonPrize.price}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Demo Mode Toggle */}
      <div className="flex items-center justify-between px-4 pt-2 pb-4">
        <span className="text-foreground text-lg">Демо режим</span>
        <Switch checked={demoMode} onCheckedChange={setDemoMode} className="demo-switch" />
      </div>

      {/* Get Gift Button */}
      <div className="px-4 pb-4">
        <button
          onClick={handleGetGift}
          disabled={isSpinning}
          className="primary-button touch-feedback"
        >
          {getButtonContent()}
        </button>
      </div>

      {/* Win Prizes Section - Horizontal Scroll */}
      <div className="pt-3">
        <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3 px-4 font-medium">
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
              className="flex-shrink-0 rounded-[12px] relative touch-feedback"
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
                <picture>
                  {prize.icon.webp && <source srcSet={prize.icon.webp} type="image/webp" />}
                  <img src={prize.icon.src} alt={prize.label} className="w-[78px] h-[78px] drop-shadow-lg" />
                </picture>
              </div>
              {/* Price badge centered */}
              <div className="absolute bottom-9 left-1/2 -translate-x-1/2 star-badge star-badge--center star-badge--tight">
                <span className="price-row">
                  <img src={StarSvg} alt="Stars" className="star-icon" />
                  <span className="text-[16px] font-normal">{prize.price}</span>
                </span>
              </div>
              {/* Chance at bottom center */}
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 chance-text">{prize.chance}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
