import Link from "next/link";
import styles from "./SiteFooter.module.scss";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.brand}>меняемся · Вещи и услуги по интересам</p>
        <nav className={styles.mobileNav} aria-label="Разделы сайта">
          <span>Каталог</span>
          <Link href="/faq">FAQ</Link>
          <span>Документация</span>
        </nav>
        <Link href="/rules" className={styles.rules}>Правила сервиса</Link>
      </div>
    </footer>
  );
}
