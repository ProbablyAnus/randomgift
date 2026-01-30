import { FC } from "react";
import StarSvg from "@/assets/gifts/star-badge.svg";
import { useAdaptivity } from "@/hooks/useAdaptivity";
import { CARD_DIMENSIONS, ICON_SIZES } from "@/components/gifts/constants";
interface GiftCardProps {
  iconPng: string;
  iconWebp?: string;
  label?: string;
  price: number;
  isSelected?: boolean;
  onClick?: () => void;
  chance?: string;
}

export const GiftCard: FC<GiftCardProps> = ({ iconPng, iconWebp, label, price, isSelected, onClick, chance }) => {
  const { sizeX } = useAdaptivity();
  const cardSize = sizeX === "compact" ? CARD_DIMENSIONS.compact : CARD_DIMENSIONS.regular;

  return (
    <button
      onClick={onClick}
      className={`gift-card ${isSelected ? "gift-card-selected" : ""}`}
      style={{ width: cardSize.width, height: cardSize.height }}
    >
      {isSelected && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-primary/50" />
      )}
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-2 pb-1">
        <picture>
          {iconWebp && <source srcSet={iconWebp} type="image/webp" />}
          <img
            src={iconPng}
            alt={label || "Подарок"}
            className="drop-shadow-lg"
            style={{ width: ICON_SIZES.card, height: ICON_SIZES.card }}
          />
        </picture>
        <div className="star-badge star-badge--center star-badge--big">
          <span className="price-row">
            <img src={StarSvg} alt="Stars" className="star-icon" />
            <span className="font-semibold">{price}</span>
          </span>
        </div>
      </div>
      {chance && (
        <span className="chance-text">{chance}</span>
      )}
    </button>
  );
};
