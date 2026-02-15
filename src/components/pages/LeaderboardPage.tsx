import { FC, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRequiredTelegramWebApp } from "@/contexts/TelegramWebAppContext";
import styles from "./LeaderboardPage.module.scss";
import { buildApiUrl } from "@/lib/api";
import { getTelegramUser } from "@/hooks/useTelegramWebApp";

interface LeaderboardUser {
  userId?: number | string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  spentStars?: number;
}

type LeaderboardResponse = {
  leaderboard?: LeaderboardUser[];
  error?: string;
};

type LeaderboardEmptyReason = "empty_leaderboard" | "load_error" | null;

let leaderboardCache: LeaderboardUser[] | null = null;
let leaderboardPrefetchPromise: Promise<LeaderboardUser[]> | null = null;
let leaderboardCacheInitData: string | undefined;

const formatXp = (count: number) => `${count} xp`;

const getDisplayName = (user: LeaderboardUser) => {
  if (user.username) return user.username;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || "Без имени";
};

const getPhotoUrl = (user: LeaderboardUser) => user.photoUrl ?? "";

const getUserId = (user: LeaderboardUser) => user.userId;

const getXpCount = (user: LeaderboardUser) => user.spentStars ?? 0;

const getPositionLabel = (position: number) => {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `#${position}`;
};

const dedupeUsers = (users: LeaderboardUser[]) => {
  const byKey = new Map<string, LeaderboardUser>();

  users.forEach((user, index) => {
    const key = String(getUserId(user) ?? user.username ?? `row-${index}`);
    if (!byKey.has(key)) {
      byKey.set(key, user);
    }
  });

  return [...byKey.values()];
};

const preloadAvatarImage = (photoUrl: string) => {
  if (!photoUrl || typeof Image === "undefined") return;
  const image = new Image();
  image.src = photoUrl;
};

const fetchLeaderboard = async (initData?: string) => {
  const response = await fetch(buildApiUrl("/api/leaderboard"), {
    headers: initData ? { "X-Telegram-Init-Data": initData } : undefined,
  });

  const data = (await response.json()) as LeaderboardResponse;

  if (!response.ok) {
    if (data?.error === "invalid_init_data") {
      console.warn("invalid_init_data: leaderboard request must be made inside Telegram");
    }
    throw new Error("failed_to_load_leaderboard");
  }

  const list = dedupeUsers(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
  list.forEach((user) => preloadAvatarImage(getPhotoUrl(user)));
  return list;
};

export const preloadLeaderboard = (initData?: string) => {
  if (leaderboardCache && leaderboardCacheInitData === initData) {
    return Promise.resolve(leaderboardCache);
  }

  if (leaderboardPrefetchPromise && leaderboardCacheInitData === initData) {
    return leaderboardPrefetchPromise;
  }

  leaderboardCacheInitData = initData;
  leaderboardPrefetchPromise = fetchLeaderboard(initData)
    .then((list) => {
      leaderboardCache = list;
      return list;
    })
    .finally(() => {
      leaderboardPrefetchPromise = null;
    });

  return leaderboardPrefetchPromise;
};

export const LeaderboardPage: FC = () => {
  const webApp = useRequiredTelegramWebApp();
  const [searchValue, setSearchValue] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [emptyReason, setEmptyReason] = useState<LeaderboardEmptyReason>(null);
  const telegramUser = getTelegramUser(webApp);
  const currentUserId = telegramUser?.id;

  useEffect(() => {
    let isMounted = true;

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setHasError(false);
      setEmptyReason(null);
      try {
        const list = await preloadLeaderboard(webApp.initData);

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
    };
  }, [webApp.initData]);

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
    const username = user.username;
    const userId = getUserId(user);
    const telegramLink = username ? `https://t.me/${username}` : userId ? `tg://user?id=${userId}` : "";

    if (!telegramLink) return;

    if (webApp.openTelegramLink) {
      webApp.openTelegramLink(telegramLink);
    } else if (webApp.openLink) {
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
