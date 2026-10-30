"use client";

import Link from "next/link";

import styles from "./NotFoundPage.module.scss";

import { useSession } from "@/src/entities/session";
import { SiteFooter, SiteHeader } from "@/src/widgets/site-chrome";

export function NotFoundPage() {
  const { user, ready } = useSession();
  const href = ready && user ? "/" : "/login";
  const label = ready && user ? "На главную" : "Войти в аккаунт";

  return (
    <div className="sitePage">
      <SiteHeader />
      <main className={styles.main}>
        <div className={styles.content}>
          <span className={styles.code}>404</span>
          <h1>Кажется, эта страница потерялась</h1>
          <p>
            Такой страницы нет или ссылка устарела. Вернитесь и продолжайте искать вещи для обмена.
          </p>
          <Link className={styles.button} href={href}>
            {label}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
