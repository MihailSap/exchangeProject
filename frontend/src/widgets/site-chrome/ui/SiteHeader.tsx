"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

import dropdown from "./HeaderDropdowns.module.scss";
import { HeaderNavigation, HeaderNavigationLinks } from "./HeaderNavigation";
import { HeaderNotifications } from "./HeaderNotifications";
import styles from "./SiteHeader.module.scss";

import { useSession } from "@/src/entities/session";
import { useDismissable } from "@/src/shared/lib/use-dismissable";
import { useTheme } from "@/src/shared/theme";
import { Avatar } from "@/src/shared/ui/avatar";
import { Icon } from "@/src/shared/ui/icon";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

function SunIcon() {
  return (
    <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M14.62.045q-.344.16-.54.522c-.094.17-.106.382-.106 1.989v1.795l.176.252c.218.306.505.464.852.464.346 0 .634-.159.85-.464l.177-.252V2.556c0-1.772 0-1.807-.135-2.036-.258-.457-.851-.674-1.274-.475M4.623 4.193c-.558.276-.722.915-.376 1.472.065.106.646.71 1.286 1.344.863.85 1.221 1.167 1.385 1.22.799.264 1.568-.54 1.274-1.326-.094-.24-2.442-2.587-2.73-2.722-.305-.14-.528-.14-.839.012M24.54 4.18c-.287.136-2.635 2.488-2.73 2.723a1.05 1.05 0 0 0 .271 1.109c.294.276.564.334.992.217.182-.053.464-.293 1.397-1.22.64-.634 1.233-1.262 1.315-1.397.499-.844-.376-1.853-1.244-1.431M14.297 7.472c-3.587.323-6.469 3.233-6.81 6.876-.24 2.657 1.075 5.385 3.33 6.887 3.187 2.118 7.407 1.555 9.855-1.314 1.092-1.279 1.69-2.68 1.837-4.306.382-4.1-2.712-7.756-6.891-8.143a22 22 0 0 0-.734-.053c-.047.006-.311.03-.587.053m2.248 2.253c1.855.557 3.147 1.842 3.722 3.714.147.475.159.592.159 1.542s-.012 1.068-.159 1.543q-.451 1.463-1.456 2.423c-.645.61-1.35 1.015-2.266 1.297-.475.146-.593.158-1.543.158-.951 0-1.069-.012-1.544-.158-1.873-.575-3.147-1.848-3.722-3.72-.147-.475-.159-.592-.159-1.543 0-.95.012-1.067.159-1.543.622-2.024 2.072-3.355 4.156-3.825.264-.058.634-.082 1.256-.064.746.018.963.047 1.397.176M.82 13.978c-.1.024-.26.094-.353.147-.657.387-.61 1.431.076 1.772.206.1.37.111 2.026.111h1.796l.252-.176c.305-.217.464-.505.464-.85 0-.347-.159-.634-.464-.851l-.252-.176-1.68-.012c-.927-.006-1.766.012-1.866.035m24.884 0c-.452.112-.78.54-.78 1.015 0 .335.158.622.463.84l.252.175h1.797c1.772 0 1.808 0 2.037-.135.358-.205.528-.493.528-.892s-.17-.686-.529-.891c-.228-.13-.275-.135-1.907-.147-.922-.006-1.761.012-1.861.035M6.907 21.74c-.247.07-2.46 2.223-2.689 2.61a1.015 1.015 0 0 0 .705 1.526c.428.07.58-.041 1.913-1.355.687-.681 1.286-1.32 1.333-1.426.158-.37.082-.792-.2-1.097-.287-.305-.628-.387-1.062-.258m15.373.059c-.451.228-.669.71-.528 1.179.059.2.294.475 1.28 1.472 1.491 1.502 1.697 1.62 2.301 1.314.452-.229.67-.71.528-1.179-.058-.2-.293-.475-1.28-1.472-1.49-1.502-1.696-1.62-2.3-1.314m-7.749 3.209a1.4 1.4 0 0 0-.382.352l-.176.252v1.795c0 1.772 0 1.807.135 2.036.206.358.493.528.893.528.399 0 .686-.17.892-.528.135-.23.135-.264.135-2.036v-1.795l-.176-.252c-.217-.305-.505-.464-.851-.464-.147 0-.358.047-.47.111"
        fill="currentColor"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M10.603.224a15.24 15.24 0 0 0-5.898 3.555C3.345 5.09 2.43 6.333 1.621 7.957c-2.937 5.926-1.818 12.906 2.832 17.585 2.943 2.966 7.03 4.596 11.134 4.449 3.213-.118 5.951-1.054 8.53-2.92 2.768-1.994 4.78-4.925 5.717-8.327.206-.753.212-.865.065-1.194-.152-.336-.492-.512-.915-.477-.258.024-.375.076-.697.318-.927.683-1.519 1.053-2.234 1.406-1.66.813-3.09 1.148-4.92 1.148a11.12 11.12 0 0 1-7.95-3.29c-2.152-2.16-3.313-4.95-3.307-7.98.006-2.607.768-4.938 2.228-6.815.37-.477.475-.789.381-1.112C12.351.3 11.94-.012 11.5 0c-.123 0-.527.106-.897.224M8.938 3.596c-.457 1.1-.78 2.337-.914 3.52-.083.723-.083 2.412 0 3.09.55 4.513 3.306 8.427 7.3 10.38 1.84.907 3.43 1.29 5.51 1.342 2.088.053 3.67-.247 5.653-1.083.334-.14.621-.24.639-.23.047.048-.704 1.254-1.167 1.878-2.58 3.478-6.444 5.456-10.665 5.456-2.961 0-5.558-.865-7.939-2.637-1.612-1.206-2.99-2.884-3.922-4.767-.933-1.889-1.343-3.672-1.343-5.808.006-1.854.264-3.26.903-4.885a13.3 13.3 0 0 1 4.884-6.073c.416-.283 1.243-.777 1.302-.783.005 0-.106.27-.24.6"
        fill="currentColor"
      />
    </svg>
  );
}

export function SiteHeader({ ownLot = false }: { ownLot?: boolean }) {
  const { user, ready, signOut } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { notify } = useToast();
  const router = useRouter();
  const [panel, setPanel] = useState<"notifications" | "profile" | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const closePanel = useCallback(() => setPanel(null), []);
  const menuRef = useDismissable<HTMLDivElement>(panel === "profile", closePanel);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    try {
      await signOut();
      notify({ kind: "success", title: "Вы вышли из аккаунта" });
      router.push("/");
    } catch (error) {
      notify({
        kind: "error",
        title: error instanceof Error ? error.message : "Не удалось завершить сессию",
      });
    } finally {
      setPanel(null);
      setSigningOut(false);
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label="Меняемся — на главную">
          меняемся.
        </Link>
        <Suspense fallback={<HeaderNavigationLinks authenticated={ready && Boolean(user)} />}>
          <HeaderNavigation authenticated={ready && Boolean(user)} ownLot={ownLot} />
        </Suspense>
        <div className={styles.actions}>
          <button
            className={styles.themeButton}
            type="button"
            aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
            title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            onClick={toggleTheme}
          >
            <span className={theme === "dark" ? styles.sunIcon : styles.moonIcon}>
              {theme === "dark" ? (
                <SunIcon />
              ) : (
                <MoonIcon />
              )}
            </span>
          </button>
          {ready && user ? (
            <>
              <HeaderNotifications
                key={user.id}
                open={panel === "notifications"}
                onToggle={() =>
                  setPanel((value) => (value === "notifications" ? null : "notifications"))
                }
                onClose={closePanel}
              />
              <div className={dropdown.anchor} ref={menuRef}>
                <button
                  type="button"
                  className={dropdown.avatarButton}
                  aria-label="Меню пользователя"
                  aria-expanded={panel === "profile"}
                  aria-controls="header-profile-menu"
                  onClick={() => setPanel((value) => (value === "profile" ? null : "profile"))}
                >
                  <Avatar name={user.name} src={user.avatarUrl} small />
                </button>
                {panel === "profile" && (
                  <nav
                    id="header-profile-menu"
                    className={`${dropdown.dropdown} ${dropdown.profile}`}
                    aria-label="Меню пользователя"
                  >
                    <div className={dropdown.user}>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link href="/profile" onClick={closePanel}>
                      <Icon name="user" />
                      Личный кабинет
                    </Link>
                    <Link href="/profile?section=reviews" onClick={closePanel}>
                      <Icon name="star" />
                      Отзывы и рейтинг
                    </Link>
                    <Link href="/profile?section=settings" onClick={closePanel}>
                      <Icon name="settings" />
                      Настройки профиля
                    </Link>
                    {user.role === "ADMIN" && user.status === "ACTIVE" && (
                      <Link href="/admin" className={dropdown.admin} onClick={closePanel}>
                        <Icon name="shield" />
                        Админ-панель
                      </Link>
                    )}
                    {user.status === "ACTIVE" && user.emailConfirmed !== false && (
                      <Link href="/lots/new" onClick={closePanel}>
                        <Icon name="plus" />
                        Новый лот
                      </Link>
                    )}
                    <button
                      type="button"
                      className={dropdown.logout}
                      disabled={signingOut}
                      onClick={handleSignOut}
                    >
                      <Icon name="logout" />
                      {signingOut ? "Выходим…" : "Выйти"}
                    </button>
                  </nav>
                )}
              </div>
              {user.status === "ACTIVE" && user.emailConfirmed !== false ? (
                <Link className={`${styles.headerButton} ${styles.createButton}`} href="/lots/new">
                  ＋ Разместить лот
                </Link>
              ) : (
                <button
                  type="button"
                  className={`${styles.headerButton} ${styles.createButton}`}
                  disabled
                  title={
                    user.status === "FROZEN"
                      ? "Действие недоступно — аккаунт заморожен"
                      : "Подтвердите почту для публикации"
                  }
                >
                  ＋ Разместить лот
                </button>
              )}
            </>
          ) : (
            <Link className={styles.headerButton} href="/login">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
