import { FC } from "react";
import styles from "./ProfilePage.module.scss";

export const ProfilePage: FC = () => {
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Профиль</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.profileCard}>
          <div className={styles.avatarRing}>
            <div className={styles.avatar}>SG</div>
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>Stargift User</div>
            <div className={styles.profileMeta}>@stargift</div>
          </div>
          <div className={styles.profileBadge}>ID 1024</div>
        </div>
      </div>
    </div>
  );
};
