import { FC, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import styles from "./LeaderboardPage.module.scss";
import { buildApiUrl } from "@/lib/api";

interface LeaderboardUser {
  id?: number | string;
  _id?: number | string;
  userId?: number | string;
  user_id?: number | string;
  username?: string;
  userName?: string;
  user_name?: string;
  name?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  photoUrl?: string;
  photo_url?: string;
  avatar?: string;
  profilePicture?: string;
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

type LeaderboardEmptyReason = "empty_leaderboard" | "load_error" | null;

const formatXp = (count: number) => `${count} xp`;

const getDisplayName = (user: LeaderboardUser) => {
  if (user.userName) return user.userName;
  if (user.username) return user.username;
  if (user.user_name) return user.user_name;
  if (user.name) return user.name;
  const fullName = [user.firstName ?? user.first_name, user.lastName ?? user.last_name].filter(Boolean).join(" ");
  return fullName || "Без имени";
};

const getPhotoUrl = (user: LeaderboardUser) => user.photoUrl ?? user.photo_url ?? user.avatar ?? user.profilePicture ?? "";

const getUserId = (user: LeaderboardUser) => user.userId ?? user.user_id ?? user.id ?? user._id;

const getXpCount = (user: LeaderboardUser) =>
  user.spentStars ??
  user.spent_stars ??
  user.starsSpent ??
  user.totalSpentStars ??
  user.total_spent_stars ??
  user.xp ??
  user.score ??
  0;

const getPositionLabel = (position: number) => {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `#${position}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const isLeaderboardUserLike = (value: unknown): value is LeaderboardUser => {
  if (!isRecord(value)) return false;

  return (
    "id" in value ||
    "_id" in value ||
    "userId" in value ||
    "user_id" in value ||
    "username" in value ||
    "userName" in value ||
    "user_name" in value ||
    "name" in value ||
    "spentStars" in value ||
    "spent_stars" in value ||
    "xp" in value ||
    "score" in value ||
    "totalSpentStars" in value ||
    "total_spent_stars" in value
  );
};

const collectLeaderboardUsers = (value: unknown, seen: WeakSet<object>): LeaderboardUser[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectLeaderboardUsers(item, seen));
  }

  if (!isRecord(value)) return [];
  if (seen.has(value)) return [];
  seen.add(value);

  if (isLeaderboardUserLike(value)) {
    return [value];
  }

  return Object.values(value).flatMap((item) => collectLeaderboardUsers(item, seen));
};

const dedupeUsers = (users: LeaderboardUser[]) => {
  const byKey = new Map<string, LeaderboardUser>();

  users.forEach((user, index) => {
    const key = String(getUserId(user) ?? user.username ?? user.userName ?? user.user_name ?? `row-${index}`);
    if (!byKey.has(key)) {
      byKey.set(key, user);
    }
  });

  return [...byKey.values()];
};

const toLeaderboardArray = (data: LeaderboardResponse): LeaderboardUser[] => {
  if (!data) return [];

  const list = collectLeaderboardUsers(data, new WeakSet<object>());
  return dedupeUsers(list);
};

export const LeaderboardPage: FC = () => {
  const { webApp } = useTelegramWebApp();
  const [searchValue, setSearchValue] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [emptyReason, setEmptyReason] = useState<LeaderboardEmptyReason>(null);
  const currentUserId = webApp?.initDataUnsafe?.user?.id;

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setHasError(false);
      setEmptyReason(null);
      try {
        const initData = webApp?.initData;
        if (!initData) {
          console.warn("initData missing: leaderboard request is outside Telegram WebApp context");
        }

        const response = await fetch(buildApiUrl("/api/leaderboard"), {
          signal: controller.signal,
          headers: initData ? { "X-Telegram-Init-Data": initData } : undefined,
        });

        const data = (await response.json()) as LeaderboardResponse & { error?: string };

        if (!response.ok) {
          if (data?.error === "invalid_init_data") {
            console.warn("invalid_init_data: leaderboard request must be made inside Telegram");
          }
          throw new Error("failed_to_load_leaderboard");
        }

        const list = toLeaderboardArray(data);

        if (!isMounted) return;
        setLeaderboard(list);
        setHasError(false);
        setEmptyReason(list.length === 0 ? "empty_leaderboard" : null);
      } catch (error) {
        console.error("Leaderboard fetch error:", error);
        if (!isMounted) return;
        setHasError(true);
        setLeaderboard([]);
        setEmptyReason("load_error");
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
  }, [webApp?.initData]);

  const rankedUsers = useMemo(() => {
    return [...leaderboard].sort((a, b) => getXpCount(b) - getXpCount(a));
  }, [leaderboard]);

  const filteredUsers = useMemo(() => {
    const trimmed = searchValue.trim().toLowerCase();
    if (!trimmed) return rankedUsers;
    return rankedUsers.filter((leader) => getDisplayName(leader).toLowerCase().includes(trimmed));
  }, [rankedUsers, searchValue]);


  useEffect(() => {
    if (!emptyReason) return;

    const detail = {
      event: "leaderboard_empty_state",
      reason: emptyReason,
      hasError,
      timestamp: Date.now(),
    };

    window.dispatchEvent(new CustomEvent("app:telemetry", { detail }));
    console.info("leaderboard_empty_state", detail);
  }, [emptyReason, hasError]);

  const handleUserClick = (user: LeaderboardUser) => {
    const username = user.username ?? user.userName ?? user.user_name;
    const userId = getUserId(user);
    const telegramLink = username ? `https://t.me/${username}` : userId ? `tg://user?id=${userId}` : "";

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
      <div className={styles.emptyState} data-empty-reason={emptyReason ?? undefined}>
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

      {searchValue.trim().length > 0 && !filteredUsers.length ? (
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
                <div className={styles.number}>{getPositionLabel(index + 1)}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
