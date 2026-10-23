import styles from "./SiteFooter.module.scss";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.brand}>меняемся · Вещи и услуги по интересам</p>
        <nav className={styles.mobileNav} aria-label="Разделы сайта">
          <span>Каталог</span>
          <span>FAQ</span>
          <span>Документация</span>
        </nav>
        <span className={styles.rules}>Правила сервиса</span>
      </div>
    </footer>
  );
}
