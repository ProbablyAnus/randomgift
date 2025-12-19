import styles from "./index.module.scss";
import clsx from "clsx";
import GiftIcon from "@/assets/tabbar/Gift.svg";
import LeaderboardIcon from "@/assets/tabbar/Earth.svg";
import ProfileIcon from "@/assets/tabbar/Contacts.Fill.Circle.svg";

export type TabType = "gifts" | "leaderboard" | "profile";

const items = [
  { id: "gifts" as const, label: "Подарки", icon: GiftIcon },
  { id: "leaderboard" as const, label: "Рейтинг", icon: LeaderboardIcon },
  { id: "profile" as const, label: "Профиль", icon: ProfileIcon },
];

export default function TabBar(props: { value: TabType; onChange: (tab: TabType) => void }) {
  const { value, onChange } = props;

  return (
    <div className={styles.tabbar} role="navigation" aria-label="Bottom navigation">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className={clsx(styles.item, value === it.id && styles.active)}
          onClick={() => onChange(it.id)}
        >
          <span className={styles.icon} style={{ backgroundImage: `url(${it.icon})` }} aria-hidden="true" />
          <span className={styles.label}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}
