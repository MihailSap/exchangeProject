import styles from "./Stars.module.scss";

export function Stars({ value }: { value: number | null }) {
  if (value === null) return <span className={styles.empty}>Нет отзывов</span>;
  return <span className={styles.stars} role="img" aria-label={`${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} из 5 звёзд`}>
    {Array.from({ length: 5 }, (_, index) => <span key={index} className={styles.star} aria-hidden="true">☆<span className={styles.fill} style={{ width: `${Math.max(0, Math.min(1, value - index)) * 100}%` }}>★</span></span>)}
  </span>;
}
