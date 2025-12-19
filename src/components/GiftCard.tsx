import { FC } from "react";
import StarSvg from "@/assets/gifts/star-badge.svg";
interface GiftCardProps {
  icon: string;
  label?: string;
  price: number;
  isSelected?: boolean;
  onClick?: () => void;
  chance?: string;
}

export const GiftCard: FC<GiftCardProps> = ({ icon, label, price, isSelected, onClick, chance }) => {
  return (
    <button
      onClick={onClick}
      style={{ background: "rgba(44, 44, 46, 1)" }}
      className={`gift-card ${isSelected ? "gift-card-selected" : ""}`}
    >
      {isSelected && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-primary/50" />
      )}
      <span className="mb-3 flex items-center justify-center">
        <img src={icon} alt={label || "Подарок"} className="h-[78px] w-[78px] drop-shadow-lg" />
      </span>
      <div className="star-badge star-badge--center star-badge--big">
        <span className="price-row">
          <img src={StarSvg} alt="Stars" className="star-icon" />
          <span className="font-semibold">{price}</span>
        </span>
      </div>
      {chance && (
        <span className="text-xs text-muted-foreground mt-2">{chance}</span>
      )}
    </button>
  );
};
