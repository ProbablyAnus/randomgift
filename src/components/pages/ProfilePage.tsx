import { FC } from "react";
import { ChevronRight, LifeBuoy, Newspaper } from "lucide-react";
import styles from "./ProfilePage.module.scss";

export const ProfilePage: FC = () => {
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Quick Gift</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>M</div>
          <div className={styles.profileName}>Mclovin</div>
        </div>

        <div className={styles.actionCard}>
          <button className={styles.actionRow} type="button">
            <span className={`${styles.actionIcon} ${styles.newsIcon}`}>
              <Newspaper size={18} />
            </span>
            <span className={styles.actionText}>Новости Quick Gift</span>
            <ChevronRight className={styles.actionChevron} size={18} />
          </button>
          <button className={styles.actionRow} type="button">
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
