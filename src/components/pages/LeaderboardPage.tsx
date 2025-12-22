import { FC, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import styles from "./LeaderboardPage.module.scss";

interface LeaderboardUser {
  userId?: number | string;
  username?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  photo_url?: string;
  gamesPlayed?: number;
  games?: number;
  plays?: number;
  giftsReceived?: number;
}

const formatGames = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} игра`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} игры`;
  return `${count} игр`;
};

const getDisplayName = (user: LeaderboardUser) => {
  if (user.userName) return user.userName;
  if (user.username) return user.username;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || "Без имени";
};

const getPhotoUrl = (user: LeaderboardUser) => user.photoUrl ?? user.photo_url ?? "";

const getGamesCount = (user: LeaderboardUser) =>
  user.gamesPlayed ?? user.games ?? user.plays ?? user.giftsReceived ?? 0;

export const LeaderboardPage: FC = () => {
  const { webApp } = useTelegramWebApp();
  const [searchValue, setSearchValue] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

  const currentUserId = webApp?.initDataUnsafe?.user?.id;

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const response = await fetch(`${apiBaseUrl}/api/leaderboard`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Не удалось загрузить рейтинг.");
        }
        const data = (await response.json()) as LeaderboardUser[] | { users?: LeaderboardUser[] };
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : data.users ?? [];
        setLeaderboard(list);
      } catch (error) {
        if (!isMounted) return;
        setHasError(true);
        setLeaderboard([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLeaderboard();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [apiBaseUrl]);

  const rankedUsers = useMemo(() => {
    return leaderboard
      .filter((user) => getGamesCount(user) > 0)
      .sort((a, b) => getGamesCount(b) - getGamesCount(a));
  }, [leaderboard]);

  const filteredUsers = useMemo(() => {
    const trimmed = searchValue.trim().toLowerCase();
    if (trimmed.length < 3) return rankedUsers;
    return rankedUsers.filter((leader) => getDisplayName(leader).toLowerCase().includes(trimmed));
  }, [rankedUsers, searchValue]);

  const handleUserClick = (user: LeaderboardUser) => {
    const username = user.username ?? user.userName;
    const userId = user.userId;
    const telegramLink = username
      ? `https://t.me/${username}`
      : userId
        ? `tg://user?id=${userId}`
        : "";

    if (!telegramLink) return;

    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(telegramLink);
    } else if (webApp?.openLink) {
      webApp.openLink(telegramLink);
    } else {
      window.open(telegramLink, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return <div className={styles.loader}>Загрузка рейтинга...</div>;
  }

  if (!rankedUsers.length) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyTitle}>Рейтинг пуст</div>
        <div className={styles.emptySubtitle}>Сыграйте хотя бы один раз, чтобы появиться здесь.</div>
        {hasError && <div className={styles.emptyHint}>Не удалось загрузить данные. Попробуйте позже.</div>}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.inputWrapper}>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            aria-label="Поиск по рейтингу"
          />
          <div className={styles.placeholder}>Поиск</div>
        </div>
      </div>

      {searchValue.trim().length > 2 && !filteredUsers.length ? (
        <div className={styles.noItems}>
          <div className={styles.noItemsTitle}>Совпадений не найдено</div>
        </div>
      ) : (
        <div className={styles.scrollbox}>
          {filteredUsers.map((leader, index) => {
            const name = getDisplayName(leader);
            const photoUrl = getPhotoUrl(leader);
            const isMe =
              currentUserId !== undefined && currentUserId !== null && String(leader.userId) === String(currentUserId);
            const gamesCount = getGamesCount(leader);
            const initial = name.charAt(0).toUpperCase();

            return (
              <button
                className={styles.row}
                key={`${leader.userId ?? name}-${index}`}
                type="button"
                onClick={() => handleUserClick(leader)}
              >
                <Avatar className={styles.avatar}>
                  <AvatarImage src={photoUrl} alt={name} />
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
                <div>
                  <div className={styles.name}>
                    {name}
                    {isMe && <span>YOU</span>}
                  </div>
                  <div className={styles.count}>{formatGames(gamesCount)}</div>
                </div>
                <div className={styles.number} data-index={index + 1} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
