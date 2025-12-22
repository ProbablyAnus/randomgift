import { FC, useMemo, useState } from "react";
import styles from "./LeaderboardPage.module.scss";

interface LeaderEntry {
  id: number;
  name: string;
  initial: string;
  accent: string;
  games: number;
  isMe?: boolean;
}

const leaders: LeaderEntry[] = [
  { id: 1, name: "Champion", initial: "C", accent: "#f5b942", games: 128, isMe: true },
  { id: 2, name: "Winner", initial: "W", accent: "#9aa0a6", games: 117 },
  { id: 3, name: "Pro Player", initial: "P", accent: "#d68b2d", games: 102 },
  { id: 4, name: "GiftMaster", initial: "G", accent: "#2f8cff", games: 96 },
  { id: 5, name: "StarHunter", initial: "S", accent: "#37c978", games: 88 },
  { id: 6, name: "LuckyOne", initial: "L", accent: "#8b5cf6", games: 77 },
  { id: 7, name: "Collector", initial: "C", accent: "#ec4899", games: 66 },
  { id: 8, name: "Beginner", initial: "B", accent: "#14b8a6", games: 52 },
];

const formatGames = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} игра`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} игры`;
  return `${count} игр`;
};

export const LeaderboardPage: FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const filteredLeaders = useMemo(() => {
    const trimmed = searchValue.trim().toLowerCase();
    if (trimmed.length < 3) return leaders;
    return leaders.filter((leader) => leader.name.toLowerCase().includes(trimmed));
  }, [searchValue]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.inputWrapper} data-filled={searchValue.length > 0}>
          <input
            className={styles.searchInput}
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            aria-label="Поиск по рейтингу"
          />
          <div className={styles.placeholder}>Поиск</div>
        </div>
      </div>

      <div className={styles.scrollbox}>
        {filteredLeaders.map((leader, index) => (
          <button className={styles.row} key={leader.id} type="button">
            <div className={styles.avatar} style={{ backgroundColor: leader.accent }}>
              {leader.initial}
            </div>
            <div className={styles.info}>
              <div className={styles.name}>
                {leader.name}
                {leader.isMe && <span className={styles.youTag}>YOU</span>}
              </div>
              <div className={styles.count}>{formatGames(leader.games)}</div>
            </div>
            <div className={styles.number} data-index={index + 1} />
          </button>
        ))}
      </div>
    </div>
  );
};
