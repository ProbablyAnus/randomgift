import { FC } from "react";
import { ChevronRight, LifeBuoy, Newspaper } from "lucide-react";
import { useTelegramWebAppContext } from "@/contexts/TelegramWebAppContext";
import styles from "./ProfilePage.module.scss";

export const ProfilePage: FC = () => {
  const { webApp } = useTelegramWebAppContext();
  const newsUrl = import.meta.env.NEWS_URL ?? "";
  const supportUrl = import.meta.env.SUPPORT_URL ?? "";

  const openLink = (url: string) => {
    if (!url) return;
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(url);
      return;
    }
    if (webApp?.openLink) {
      webApp.openLink(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>M</div>
          <div className={styles.profileName}>Mclovin</div>
        </div>

        <div className={styles.actionCard}>
          <button className={styles.actionRow} type="button" onClick={() => openLink(newsUrl)}>
            <span className={`${styles.actionIcon} ${styles.newsIcon}`}>
              <Newspaper size={18} />
            </span>
            <span className={styles.actionText}>Новости Quick Gift</span>
            <ChevronRight className={styles.actionChevron} size={18} />
          </button>
          <button className={styles.actionRow} type="button" onClick={() => openLink(supportUrl)}>
            <span className={`${styles.actionIcon} ${styles.supportIcon}`}>
              <LifeBuoy size={18} />
            </span>
            <span className={styles.actionText}>Связаться с поддержкой</span>
            <ChevronRight className={styles.actionChevron} size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
