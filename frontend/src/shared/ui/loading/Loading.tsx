import styles from "./Loading.module.scss";

export function Loading({
  label = "Загружаем данные…",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className={`${styles.loading} ${compact ? styles.compact : ""}`} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
