import { FC, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import styles from "./LeaderboardPage.module.scss";

interface LeaderboardUser {
  id?: number | string;
  userId?: number | string;
  user_id?: number | string;
  username?: string;
  userName?: string;
  user_name?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  photoUrl?: string;
  photo_url?: string;
  avatar?: string;
  gamesPlayed?: number;
  games_played?: number;
  games?: number;
  plays?: number;
  giftsReceived?: number;
  gifts_received?: number;
  spentStars?: number;
  spent_stars?: number;
  starsSpent?: number;
  totalSpentStars?: number;
  total_spent_stars?: number;
  xp?: number;
  score?: number;
}

type LeaderboardPayloadObject = {
  users?: LeaderboardUser[];
  leaderboard?: LeaderboardUser[];
  items?: LeaderboardUser[];
  rows?: LeaderboardUser[];
  list?: LeaderboardUser[];
  data?: LeaderboardPayload;
  result?: LeaderboardPayload;
  payload?: LeaderboardPayload;
};

type LeaderboardPayload = LeaderboardUser[] | LeaderboardPayloadObject;

type LeaderboardResponse = LeaderboardPayload | null | undefined;

const formatXp = (count: number) => `${count} XP`;

const getDisplayName = (user: LeaderboardUser) => {
  if (user.userName) return user.userName;
  if (user.username) return user.username;
  if (user.user_name) return user.user_name;
  const fullName = [user.firstName ?? user.first_name, user.lastName ?? user.last_name].filter(Boolean).join(" ");
  return fullName || "Без имени";
};

const getPhotoUrl = (user: LeaderboardUser) => user.photoUrl ?? user.photo_url ?? user.avatar ?? "";

const getUserId = (user: LeaderboardUser) => user.userId ?? user.user_id ?? user.id;

const getXpCount = (user: LeaderboardUser) =>
  user.spentStars ??
  user.spent_stars ??
  user.starsSpent ??
  user.totalSpentStars ??
  user.total_spent_stars ??
  user.xp ??
  user.score ??
  user.gamesPlayed ??
  user.games_played ??
  user.games ??
  user.plays ??
  user.giftsReceived ??
  user.gifts_received ??
  0;

const toLeaderboardArray = (data: LeaderboardResponse): LeaderboardUser[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  const arrayFields: (keyof LeaderboardPayloadObject)[] = ["users", "leaderboard", "items", "rows", "list"];
  for (const field of arrayFields) {
    const value = data[field];
    if (Array.isArray(value)) return value;
  }

  const nestedFields: (keyof LeaderboardPayloadObject)[] = ["data", "result", "payload"];
  for (const field of nestedFields) {
    const nested = data[field];
    const list = toLeaderboardArray(nested);
    if (list.length) return list;
  }

  return [];
};

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
        const initData = webApp?.initData;
        const response = await fetch(`${apiBaseUrl}/api/leaderboard`, {
          signal: controller.signal,
          headers: initData ? { "X-Telegram-Init-Data": initData } : undefined,
        });
        if (!response.ok) {
          throw new Error("Не удалось загрузить рейтинг.");
        }
        const data = (await response.json()) as LeaderboardResponse;
        if (!isMounted) return;
        const list = toLeaderboardArray(data);
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
  }, [apiBaseUrl, webApp?.initData]);

  const rankedUsers = useMemo(() => {
    return [...leaderboard].sort((a, b) => getXpCount(b) - getXpCount(a));
  }, [leaderboard]);

  const filteredUsers = useMemo(() => {
    const trimmed = searchValue.trim().toLowerCase();
    if (trimmed.length < 3) return rankedUsers;
    return rankedUsers.filter((leader) => getDisplayName(leader).toLowerCase().includes(trimmed));
  }, [rankedUsers, searchValue]);

  const handleUserClick = (user: LeaderboardUser) => {
    const username = user.username ?? user.userName ?? user.user_name;
    const userId = getUserId(user);
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
          <div className={styles.emptySubtitle}>Пока нет пользователей для отображения.</div>
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
              currentUserId !== undefined && currentUserId !== null && String(getUserId(leader)) === String(currentUserId);
            const xpCount = getXpCount(leader);
            const initial = name.charAt(0).toUpperCase();

            return (
              <button
                className={styles.row}
                key={`${getUserId(leader) ?? name}-${index}`}
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
                  <div className={styles.count}>{formatXp(xpCount)}</div>
                </div>
                <div className={styles.number}>#{index + 1}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
