import { FC } from "react";
import { StarIcon } from "@/components/icons/StarIcon";
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
            <StarIcon className="tg-tab__star" />
            <span className="tg-tab__text">{price}</span>
          </button>
        );
      })}
    </div>
  );
};
