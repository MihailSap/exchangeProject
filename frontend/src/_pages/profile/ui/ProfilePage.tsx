"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CompletedPanel } from "./CompletedPanel";
import { LotCard } from "./LotCard";
import styles from "./ProfilePage.module.scss";
import { ReviewsPanel } from "./ReviewsPanel";
import { DEMO_EXCHANGES, DEMO_REVIEWS, DEMO_SENT_REVIEWS, ratingOf } from "../model/demo-data";
import { useProfileLots } from "../model/use-profile-lots";

import type { LotAction } from "./LotCard";
import type { ProfileLotFilter } from "../model/use-profile-lots";
import type { Lot } from "@/src/entities/lot";
import type { UserProfile } from "@/src/entities/profile";
import type { IconName } from "@/src/shared/ui/icon";

import { getLotPath, republishLot } from "@/src/entities/lot";
import { getPublicProfile, resendConfirmation } from "@/src/entities/profile";
import { updateSessionProfile, useSession } from "@/src/entities/session";
import { HelpDialog } from "@/src/features/help";
import { DeleteLotDialog as LotDialog } from "@/src/features/lot-management";
import { useNotifications } from "@/src/features/notifications";
import { ProfileSettings } from "@/src/features/profile-settings";
import { ApiError } from "@/src/shared/api/client";
import { Avatar } from "@/src/shared/ui/avatar";
import { Breadcrumbs } from "@/src/shared/ui/breadcrumbs";
import { Icon } from "@/src/shared/ui/icon";
import { Loading } from "@/src/shared/ui/loading";
import { Stars } from "@/src/shared/ui/stars";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";
import { SiteFooter, SiteHeader } from "@/src/widgets/site-chrome";

type LoadState =
  { status: "loading" } | { status: "error" } | { status: "ready"; profile: UserProfile };

type Section = "lots" | "reviews" | "settings";

const FILTERS: { value: ProfileLotFilter; label: string }[] = [
  { value: "all", label: "Все лоты" },
  { value: "ACTIVE", label: "Активные" },
  { value: "MODERATION", label: "На модерации" },
  { value: "ARCHIVED", label: "Архив" },
  { value: "COMPLETED", label: "Завершённые" },
];

export function ProfilePage({ userId }: { userId?: number }) {
  const own = userId === undefined;
  const { user, ready, setUser } = useSession();
  const viewerId = user?.id;
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const { notify } = useToast();
  const { receive } = useNotifications();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [help, setHelp] = useState(false);
  const [dialog, setDialog] = useState<{ action: LotAction; lot: Lot } | null>(null);
  const [sending, setSending] = useState(false);
  const [resendAt, setResendAt] = useState<number>(0);
  const [now, setNow] = useState(0);
  const requestedSection = search.get("section");
  const section: Section =
    requestedSection === "reviews"
      ? "reviews"
      : own && requestedSection === "settings"
        ? "settings"
        : "lots";

  const filters = own ? FILTERS : FILTERS.filter(({ value }) => value === "all" || value === "COMPLETED");
  const requestedFilter = search.get("status");
  const filter = filters.find(({ value }) => value === requestedFilter)?.value ?? "all";

  useEffect(() => {
    if (!ready) return;

    if (own && !viewerId) {
      router.replace("/login");

      return;
    }

    if (!own && viewerId === userId) {
      router.replace("/profile");

      return;
    }

    let active = true;
    setState({ status: "loading" });
    const request = own
      ? updateSessionProfile().then((profile): UserProfile => ({
        ...profile,
        emailConfirmed: profile.emailConfirmed ?? false,
      }))
      : getPublicProfile(userId);

    request
      .then((profile) => {
        if (!active) return;

        setState({ status: "ready", profile });
      })
      .catch((error: unknown) => {
        if (!active) return;

        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
          router.replace(error.status === 401 && own ? "/login" : "/");
        } else setState({ status: "error" });

        notify({
          kind: "error",
          title: error instanceof Error ? error.message : "Не удалось загрузить профиль",
        });
      });

    return () => {
      active = false;
    };
  }, [ready, viewerId, userId, own, router, notify, attempt]);

  useEffect(() => {
    if (!resendAt) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, [resendAt]);

  function navigate(nextSection: Section, nextFilter: ProfileLotFilter = filter) {
    const query = new URLSearchParams();
    if (nextSection !== "lots") query.set("section", nextSection);

    if (nextFilter !== "all" && nextSection === "lots") query.set("status", nextFilter);

    router.replace(`${pathname}${query.size ? `?${query}` : ""}`, { scroll: false });
  }

  async function resend() {
    if (sending || resendAt > Date.now()) return;

    setSending(true);
    try {
      await resendConfirmation();
      setResendAt(Date.now() + 300_000);
      setNow(Date.now());
      notify({
        kind: "success",
        title: "Письмо отправлено",
        description: "Проверьте почту и папку «Спам».",
      });
    } catch (error) {
      notify({
        kind: "error",
        title: error instanceof Error ? error.message : "Не удалось отправить письмо",
      });
    } finally {
      setSending(false);
    }
  }

  const profile =
    state.status === "ready"
      ? own && user
        ? { ...user, emailConfirmed: user.emailConfirmed ?? false }
        : state.profile.id === userId ? state.profile : null
      : null;

  useEffect(() => {
    if (profile) document.title = own ? "Меняемся - Личный кабинет" : `Меняемся - ${profile.name}`;
  }, [own, profile?.name]);
  const canManage = own && user?.status === "ACTIVE" && profile?.emailConfirmed === true;
  const lotOwnerId = profile && section === "lots" && (own ? profile.id === viewerId : viewerId !== userId)
    ? profile.id
    : undefined;

  const lotList = useProfileLots(lotOwnerId, own, section === "lots" ? filter : null);
  const accessError = lotList.error?.status;

  useEffect(() => {
    if (accessError === 401 && own) router.replace("/login");

    if (accessError === 403) router.replace("/");
  }, [accessError, own, router]);

  const reviews = DEMO_REVIEWS;
  const sentReviews = DEMO_SENT_REVIEWS.map((review) => ({
    ...review,
    authorId: profile?.id ?? 1,
    authorName: profile?.name ?? review.authorName,
  }));

  const exchanges = DEMO_EXCHANGES;
  const count = (status: ProfileLotFilter) =>
    status === "COMPLETED" ? exchanges.length : lotList.counts[status] ?? "—";

  async function onAction(action: LotAction, lot: Lot) {
    if (action === "view") {
      router.push(getLotPath(lot));

      return;
    }

    if (!own || !canManage) return;

    if ((action === "republish" || action === "edit") && !canManage) return;

    if (action === "edit") {
      router.push(`${getLotPath(lot)}/edit`);

      return;
    }

    if (action === "republish") {
      try {
        const updated = await republishLot(lot);
        lotList.reload();
        if (action === "republish")
          receive({
            id: `republished:${lot.id}:${updated.published_at}`,
            type: "LOT_REPUBLISHED",
            lotId: lot.id,
            lotPath: getLotPath(lot),
            lotTitle: lot.title,
            createdAt: new Date().toISOString(),
          });

        notify({
          kind: "success",
          title: "Лот опубликован заново",
        });
      } catch (error) {
        notify({
          kind: "error",
          title: error instanceof Error ? error.message : "Не удалось изменить лот",
        });
      }
    } else setDialog({ action, lot });
  }

  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));

  return (
    <div className="sitePage">
      <SiteHeader />
      <main className={styles.main}>
        <div className={styles.pageHeading}>
          <Breadcrumbs
            items={[
              { label: "Главная", href: "/" },
              { label: own ? "Личный кабинет" : "Профиль пользователя" },
            ]}
          />
          <h1>{own ? "Личный кабинет" : "Профиль пользователя"}</h1>
          <p>
            {own
              ? "Управляйте лотами, предложениями и профилем в одном месте"
              : "Лоты, отзывы и завершённые обмены участника"}
          </p>
        </div>
        {!profile || !ready || (own && !user) ? (
          <section className={styles.loading} aria-live="polite">
            {state.status === "error" ? (
              <>
                <h2>Не удалось загрузить профиль</h2>
                <p>Попробуйте ещё раз немного позже.</p>
                <button type="button" onClick={() => setAttempt((value) => value + 1)}>
                  Повторить
                </button>
              </>
            ) : (
              <Loading label="Загружаем профиль…" />
            )}
          </section>
        ) : (
          <div className={styles.layout}>
            <aside className={styles.sidebar} aria-label="Профиль и разделы кабинета">
              <div className={styles.identity}>
                <Avatar name={profile.name} src={profile.avatarUrl} />
                <div>
                  <h2>{profile.name}</h2>
                  <p>
                    {profile.region || "Регион не указан"}
                    {profile.createdAt
                      ? ` · участник с ${new Date(profile.createdAt).getFullYear()}`
                      : ""}
                  </p>
                </div>
              </div>
              <span
                className={`${styles.verified} ${!profile.emailConfirmed ? styles.unverified : ""}`}
              >
                {profile.emailConfirmed ? "Почта подтверждена" : "Почта не подтверждена"}
              </span>
              {own && !profile.emailConfirmed && (
                <button
                  type="button"
                  className={styles.resend}
                  disabled={sending || wait > 0}
                  onClick={resend}
                >
                  {sending
                    ? "Отправляем…"
                    : wait > 0
                      ? `Повторить через ${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, "0")}`
                      : "Отправить письмо повторно"}
                </button>
              )}
              {!own && (
                <div className={styles.publicInfo}>
                  <Stars value={ratingOf(reviews)} />
                  {profile.contacts && <p>{profile.contacts}</p>}
                </div>
              )}
              <nav className={styles.sideNav} aria-label="Разделы профиля">
                {(
                  [
                    { id: "lots", label: own ? "Мои лоты" : "Лоты пользователя", icon: "lots" },
                    { id: "reviews", label: "Отзывы и рейтинг", icon: "star" },
                    ...(own
                      ? [{ id: "settings", label: "Настройки профиля", icon: "settings" }]
                      : []),
                  ] as { id: Section; label: string; icon: IconName }[]
                ).map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    aria-current={section === item.id ? "page" : undefined}
                    className={section === item.id ? styles.selected : ""}
                    onClick={() => navigate(item.id)}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className={styles.help}>
                <h3>Нужна помощь?</h3>
                <p>Ответы на вопросы о публикации и обмене.</p>
                <button type="button" onClick={() => setHelp(true)}>
                  Открыть справку
                </button>
              </div>
            </aside>
            <div className={styles.content}>
              {own && user?.status === "FROZEN" && (
                <p className={styles.restriction} role="status">
                  Аккаунт заморожен. Управление лотами недоступно. Обратитесь в поддержку.
                </p>
              )}
              {section === "settings" && own && user ? (
                <ProfileSettings key={user.id} user={user} onSaved={setUser} />
              ) : section === "reviews" ? (
                <ReviewsPanel key={profile.id} reviews={reviews} sentReviews={sentReviews} />
              ) : (
                <>
                  <div className={styles.contentHeading}>
                    <h2>{own ? "Мои лоты" : "Лоты пользователя"}</h2>
                    {own &&
                      (canManage ? (
                        <Link className={styles.newLot} href="/lots/new">
                          + Новый лот
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={styles.newLot}
                          disabled
                          title={
                            user?.status === "FROZEN"
                              ? "Действие недоступно — аккаунт заморожен"
                              : "Подтвердите почту для публикации"
                          }
                        >
                          + Новый лот
                        </button>
                      ))}
                  </div>
                  <div className={`${styles.stats} ${!own ? styles.publicStats : ""}`}>
                    {(
                      [
                        {
                          label: own ? "Активные" : "Все лоты",
                          status: own ? "ACTIVE" : "all",
                          icon: "active",
                          value: count(own ? "ACTIVE" : "all"),
                        },
                        ...(own
                          ? [
                            {
                              label: "На модерации",
                              status: "MODERATION",
                              icon: "moderation",
                              value: count("MODERATION"),
                            },
                            {
                              label: "Архив",
                              status: "ARCHIVED",
                              icon: "archive",
                              value: count("ARCHIVED"),
                            },
                          ]
                          : []),
                        {
                          label: "Завершённые обмены",
                          status: "COMPLETED",
                          icon: "completed",
                          value: exchanges.length,
                        },
                      ] as { label: string; status: ProfileLotFilter; icon: string; value: number | string }[]
                    ).map((item) => (
                      <button
                        type="button"
                        key={item.status}
                        onClick={() => navigate("lots", item.status)}
                        className={styles.stat}
                      >
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <Image
                          src={`/images/profile/dot-${item.icon}.svg`}
                          alt=""
                          width={24}
                          height={24}
                        />
                      </button>
                    ))}
                  </div>
                  <nav className={styles.filters} aria-label="Фильтры лотов">
                    {filters.map((item) => (
                      <button
                        type="button"
                        key={item.value}
                        className={filter === item.value ? styles.activeFilter : ""}
                        aria-pressed={filter === item.value}
                        onClick={() => navigate("lots", item.value)}
                      >
                        {item.label}
                        <span>
                          {count(item.value)}
                        </span>
                      </button>
                    ))}
                  </nav>
                  {filter === "COMPLETED" ? (
                    <CompletedPanel exchanges={exchanges} />
                  ) : lotList.lots.length ? (
                    <>
                      <div className={styles.lots} aria-busy={lotList.loading}>
                        {lotList.lots.map((lot, index) => (
                          <LotCard
                            key={lot.id}
                            eager={index === 0}
                            lot={lot}
                            own={own}
                            canManage={canManage}
                            onAction={onAction}
                          />
                        ))}
                      </div>
                      {!lotList.error && lotList.hasMore && (
                        <div className={styles.empty}>
                          {lotList.loading ? <Loading compact label="Загружаем лоты…" /> : (
                            <button type="button" onClick={lotList.loadMore}>Загрузить ещё</button>
                          )}
                        </div>
                      )}
                    </>
                  ) : lotList.loading ? (
                    <div className={styles.loading} aria-live="polite">
                      <Loading label="Загружаем лоты…" />
                    </div>
                  ) : !lotList.error ? (
                    <div className={own && filter !== "all" ? `${styles.empty} ${styles.emptyStatus}` : styles.empty}>
                      <h3>{filter === "all" ? own ? "У вас пока нет лотов" : "У пользователя пока нет лотов" : "Нет лотов с выбранным статусом"}</h3>
                      {filter === "all" && own && canManage ? (
                        <Link className={styles.newLot} href="/lots/new">Разместить лот</Link>
                      ) : null}
                    </div>
                  ) : null}
                  {filter !== "COMPLETED" && lotList.error && (
                    <div className={styles.empty} role="status">
                      <p>{lotList.error.message}</p>
                      <button type="button" onClick={lotList.reload}>Повторить</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
      {help && <HelpDialog onClose={() => setHelp(false)} />}
      {dialog && (
        <LotDialog
          key={`${dialog.lot.id}:${dialog.action}`}
          {...dialog}
          onClose={() => setDialog(null)}
          onDelete={() => {
            lotList.reload();
            setDialog(null);
            notify({ kind: "success", title: "Лот удалён" });
          }}
        />
      )}
    </div>
  );
}
