import { useTheme } from "../../theme";
import styles from "./CustomEmpty.module.css";

/**
 * Custom empty state component with theme-aware images
 * Replaces the default AntD Empty component
 */
export const CustomEmpty: React.FC = () => {
  const { isDark } = useTheme();
  const imageSrc = isDark
    ? "/video/no-data-dark.png"
    : "/video/no-data-light.png";

  return (
    <div className={styles.container}>
      <img src={imageSrc} alt="No data" className={styles.image} />
    </div>
  );
};
