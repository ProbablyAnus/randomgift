import { FC } from "react";
import StarSvg from "@/assets/gifts/star-badge.svg";
interface PriceTabsProps {
  prices: number[];
  selectedPrice: number;
  onSelect: (price: number) => void;
}

export const PriceTabs: FC<PriceTabsProps> = ({ prices, selectedPrice, onSelect }) => {
  return (
    <div className="tg-tabs">
      {prices.map((price) => {
        const isSelected = selectedPrice === price;
        return (
          <button
            key={price}
            onClick={() => onSelect(price)}
            className={isSelected ? "tg-tab tg-tab--active" : "tg-tab"}
            type="button"
          >
            <img src={StarSvg} alt="Stars" className="tg-tab__star" />
            <span className="tg-tab__text">{price}</span>
          </button>
        );
      })}
    </div>
  );
};
