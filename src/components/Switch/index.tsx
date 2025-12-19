import { useState } from "react";
import clsx from "clsx";
import styles from "./index.module.scss";

interface Item {
  label?: string;
  image?: string;
}

export default function Switch(props: {
  items: Item[];
  value: number;
  className?: string;
  onChange: (value: number) => void;
}) {
  const { className, items, value, onChange } = props;

  const [dir, setDir] = useState(
    value === 0 ? "right" : value === items.length - 1 ? "left" : "right",
  );

  const doToggle = () => {
    let newValue = value;

    if (dir === "right") {
      newValue++;
      if (newValue === items.length) {
        setDir("left");
        newValue -= 2;
      }
    } else {
      newValue--;
      if (newValue < 0) {
        setDir("right");
        newValue += 2;
      }
    }

    onChange(newValue);
  };

  return (
    <div
      className={clsx(styles.wrapper, value && styles.right, className)}
      onPointerDown={doToggle}
      style={
        {
          ["--itemSize" as any]: `${100 / items.length}%`,
          ["--itemPos" as any]: `${(100 / (items.length - 1)) * value}%`,
        } as React.CSSProperties
      }
      role="switch"
      aria-label="switch"
    >
      {items.map((item, index) => (
        <div
          key={index}
          data-active={value === index ? "1" : undefined}
          style={
            item.image
              ? ({ ["--bg" as any]: `url(${item.image})` } as React.CSSProperties)
              : undefined
          }
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
