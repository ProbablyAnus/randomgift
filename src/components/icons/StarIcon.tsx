import { FC } from "react";

interface StarIconProps {
  className?: string;
  size?: number;
}

// Inline SVG so we can control color via `currentColor` (needed for Telegram theme params).
export const StarIcon: FC<StarIconProps> = ({ className = "", size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden={true}
    focusable={false}
  >
    <path d="M12 2.4l2.95 6.02 6.65.97-4.8 4.68 1.13 6.63L12 17.86 6.07 20.7l1.13-6.63-4.8-4.68 6.65-.97L12 2.4z" />
  </svg>
);
