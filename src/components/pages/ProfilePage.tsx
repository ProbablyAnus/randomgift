import { FC } from "react";
import useTheme from "@/hooks/useTheme";
import styles from "./ProfilePage.module.scss";
import lightIcon from "./profile_icons/light.svg";
import darkIcon from "./profile_icons/dark.svg";

const ThemeToggle: FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className={styles.themeToggle} aria-label="Theme">
      <button
        type="button"
        className={`${styles.themeBtn} ${theme === "light" ? styles.active : ""}`}
        onClick={() => setTheme("light")}
        aria-pressed={theme === "light"}
      >
        <img src={lightIcon} alt="Light" />
      </button>
      <button
        type="button"
        className={`${styles.themeBtn} ${theme === "dark" ? styles.active : ""}`}
        onClick={() => setTheme("dark")}
        aria-pressed={theme === "dark"}
      >
        <img src={darkIcon} alt="Dark" />
      </button>
    </div>
  );
};

export const ProfilePage: FC = () => {
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Профиль</h1>
        <ThemeToggle />
      </div>

      <div className={styles.content}>
        {/* Остальная логика профиля (аватар/данные) остаётся как было в проекте */}
      </div>
    </div>
  );
};
