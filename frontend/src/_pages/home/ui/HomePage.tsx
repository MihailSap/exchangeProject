"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/src/entities/session";
import { updateSessionProfile } from "@/src/entities/session";
import { ApiError } from "@/src/shared/api/client";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";
import { SiteFooter, SiteHeader } from "@/src/widgets/site-chrome";
import styles from "./HomePage.module.scss";

export function HomePage() {
  const { user, ready, setUser, signOut } = useSession();
  const { notify } = useToast();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    setProfileLoading(true);

    updateSessionProfile()
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401 && active) {
          setUser(null);
        } else if (active) {
          notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось загрузить профиль" });
        }
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [notify, ready, setUser, user?.id]);

  async function handleSignOut() {
    try {
      await signOut();
      notify({ kind: "success", title: "Вы вышли из аккаунта" });
      router.refresh();
    } catch (error) {
      notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось завершить сессию" });
    }
  }

  return (
    <div className="sitePage">
      <SiteHeader />
      <main className={styles.main}>
        <section className={styles.card}>
          <span className={styles.eyebrow}>МЕНЯЕМСЯ · ВЕЩАМ ВТОРУЮ ЖИЗНЬ</span>
          <h1>Добро пожаловать</h1>
          {!ready ? (
            <p className={styles.muted}>Проверяем сессию…</p>
          ) : user ? (
            <div className={styles.profile}>
              <h2>Данные пользователя</h2>
              {profileLoading && <p className={styles.muted}>Обновляем профиль…</p>}
              <dl>
                <div><dt>Имя</dt><dd>{user.name}</dd></div>
                <div><dt>Email</dt><dd>{user.email}</dd></div>
                <div><dt>Почта</dt><dd>{user.emailConfirmed ? "Подтверждена" : "Не подтверждена"}</dd></div>
                <div><dt>Статус аккаунта</dt><dd>{user.status === "FROZEN" ? "Заморожен" : "Активен"}</dd></div>
              </dl>
              <button className={styles.button} type="button" onClick={handleSignOut}>Выйти из аккаунта</button>
            </div>
          ) : (
            <div className={styles.guest}>
              <p>Вы просматриваете приложение как гость. Войдите или создайте аккаунт, чтобы начать обмены.</p>
              <div className={styles.actions}>
                <Link className={styles.button} href="/login">Войти</Link>
                <Link className={styles.secondaryButton} href="/register">Создать аккаунт</Link>
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
