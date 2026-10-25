"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { updateSessionProfile, useSession } from "@/src/entities/session";
import { getPublicProfile, resendConfirmation } from "@/src/entities/profile";
import type { UserProfile } from "@/src/entities/profile";
import { archiveLot, republishLot, initializeFixtureLots } from "@/src/entities/lot";
import type { Lot, LotStatus } from "@/src/entities/lot";
import { Icon } from "@/src/shared/ui/icon";
import type { IconName } from "@/src/shared/ui/icon";
import { Breadcrumbs } from "@/src/shared/ui/breadcrumbs";
import { useNotifications } from "@/src/features/notifications";
import { HelpDialog } from "@/src/features/help";
import { ProfileSettings } from "@/src/features/profile-settings";
import { ApiError } from "@/src/shared/api/client";
import { Avatar } from "@/src/shared/ui/avatar";
import { Stars } from "@/src/shared/ui/stars";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";
import { SiteFooter, SiteHeader } from "@/src/widgets/site-chrome";
import { DEMO_EXCHANGES, DEMO_REVIEWS, ratingOf } from "../model/demo-data";
import { LotCard } from "./LotCard";
import type { LotAction } from "./LotCard";
import { DeleteLotDialog as LotDialog } from "@/src/features/lot-management";
import { ReviewsPanel } from "./ReviewsPanel";
import { CompletedPanel } from "./CompletedPanel";
import styles from "./ProfilePage.module.scss";

type LoadState = { status: "loading" } | { status: "error" } | { status: "ready"; profile: UserProfile };
type Section = "lots" | "reviews" | "settings";
type Filter = "all" | "ACTIVE" | "MODERATION" | "ARCHIVED" | "COMPLETED";
const FILTERS: { value: Filter; label: string }[] = [{ value: "all", label: "Все лоты" }, { value: "ACTIVE", label: "Активные" }, { value: "MODERATION", label: "На модерации" }, { value: "ARCHIVED", label: "Архив" }, { value: "COMPLETED", label: "Завершённые" }];

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
  const [lots, setLots] = useState<Lot[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [help, setHelp] = useState(false);
  const [dialog, setDialog] = useState<{ action: LotAction; lot: Lot } | null>(null);
  const [sending, setSending] = useState(false);
  const [resendAt, setResendAt] = useState<number>(0);
  const [now, setNow] = useState(0);
  const requestedSection = search.get("section");
  const section: Section = requestedSection === "reviews" ? "reviews" : own && requestedSection === "settings" ? "settings" : "lots";
  const requestedFilter = search.get("status");
  const filter: Filter = FILTERS.some((item) => item.value === requestedFilter) && (own || requestedFilter === "COMPLETED") ? requestedFilter as Filter : "all";

  useEffect(() => {
    if (!ready) return;
    if (own && !viewerId) { router.replace("/login"); return; }
    if (!own && viewerId === userId) { router.replace("/profile"); return; }
    let active = true;
    setState({ status: "loading" });
    const request = own ? updateSessionProfile().then((profile): UserProfile => ({ ...profile, emailConfirmed: profile.emailConfirmed ?? false })) : getPublicProfile(userId);
    request.then((profile) => {
      if (!active) return;
      setState({ status: "ready", profile });
      setLots(initializeFixtureLots(profile.id, profile.name, profile.region || "Москва"));
    }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
        router.replace(error.status === 401 && own ? "/login" : "/");
      } else setState({ status: "error" });
      notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось загрузить профиль" });
    });
    return () => { active = false; };
  }, [ready, viewerId, userId, own, router, notify, attempt]);

  useEffect(() => {
    if (!resendAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  function navigate(nextSection: Section, nextFilter: Filter = filter) {
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
      setResendAt(Date.now() + 300_000); setNow(Date.now());
      notify({ kind: "success", title: "Письмо отправлено", description: "Проверьте почту и папку «Спам»." });
    } catch (error) { notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось отправить письмо" }); }
    finally { setSending(false); }
  }
  const profile = state.status === "ready" ? own && user ? { ...user, emailConfirmed: user.emailConfirmed ?? false } : state.profile : null;
  useEffect(() => { if (profile) document.title = own ? "Меняемся - Личный кабинет" : `Меняемся - ${profile.name}`; }, [own, profile?.name]);
  const canManage = own && user?.status === "ACTIVE" && profile?.emailConfirmed === true;
  const visibleLots = lots.filter((lot) => lot.status !== "DELETED" && (own || lot.status === "ACTIVE"));
  const filteredLots = filter === "all" ? visibleLots : visibleLots.filter((lot) => lot.status === filter);
  const count = (status: LotStatus) => lots.filter((lot) => lot.status === status).length;
  const reviews = DEMO_REVIEWS.map((review) => ({ ...review, lotId: review.lotId + Math.max(0, (profile?.id ?? 1) - 1) * 100 })).filter((review) => lots.some((lot) => lot.id === review.lotId));
  const exchanges = DEMO_EXCHANGES.map((exchange) => ({ ...exchange, lotId: exchange.lotId + Math.max(0, (profile?.id ?? 1) - 1) * 100 })).filter((exchange) => lots.some((lot) => lot.id === exchange.lotId && lot.status === "COMPLETED"));
  async function onAction(action: LotAction, lot: Lot) {
    if (action === "view") { router.push(`/lots/${lot.id}`); return; }
    if (!own) return;
    if ((action === "archive" || action === "republish" || action === "edit") && !canManage) return;
    if (action === "edit") { router.push(`/lots/${lot.id}/edit`); return; }
    if (action === "archive" || action === "republish") {
      try {
        const updated = action === "archive" ? await archiveLot(lot) : await republishLot(lot);
        setLots((current) => current.map((item) => item.id === lot.id ? updated : item));
        if (action === "republish") receive({ id: `republished:${lot.id}:${updated.published_at}`, type: "LOT_REPUBLISHED", lotId: lot.id, lotTitle: lot.title, createdAt: new Date().toISOString() });
        notify({ kind: "success", title: action === "archive" ? "Лот перемещён в архив" : "Лот опубликован заново" });
      } catch (error) { notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось изменить лот" }); }
    } else setDialog({ action, lot });
  }
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));
  return <div className="sitePage"><SiteHeader />
    <main className={styles.main}>
      <div className={styles.pageHeading}><Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: own ? "Личный кабинет" : "Профиль пользователя" }]} /><h1>{own ? "Личный кабинет" : "Профиль пользователя"}</h1><p>{own ? "Управляйте лотами, предложениями и профилем в одном месте" : "Лоты, отзывы и завершённые обмены участника"}</p></div>
      {!profile || !ready || (own && !user) ? <section className={styles.loading} aria-live="polite">{state.status === "error" ? <><h2>Не удалось загрузить профиль</h2><p>Попробуйте ещё раз немного позже.</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Повторить</button></> : <p role="status">Загружаем профиль…</p>}</section> : <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Профиль и разделы кабинета">
          <div className={styles.identity}><Avatar name={profile.name} src={profile.avatarUrl} /><div><h2>{profile.name}</h2><p>{profile.region || "Регион не указан"}{profile.createdAt ? ` · участник с ${new Date(profile.createdAt).getFullYear()}` : ""}</p></div></div>
          <span className={`${styles.verified} ${!profile.emailConfirmed ? styles.unverified : ""}`}>{profile.emailConfirmed ? "Почта подтверждена" : "Почта не подтверждена"}</span>
          {own && !profile.emailConfirmed && <button type="button" className={styles.resend} disabled={sending || wait > 0} onClick={resend}>{sending ? "Отправляем…" : wait > 0 ? `Повторить через ${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, "0")}` : "Отправить письмо повторно"}</button>}
          {!own && <div className={styles.publicInfo}><Stars value={ratingOf(reviews)} />{profile.contacts && <p>{profile.contacts}</p>}</div>}
          <nav className={styles.sideNav} aria-label="Разделы профиля">
            {([{ id: "lots", label: own ? "Мои лоты" : "Лоты пользователя", icon: "lots" }, { id: "reviews", label: "Отзывы и рейтинг", icon: "star" }, ...(own ? [{ id: "settings", label: "Настройки профиля", icon: "settings" }] : [])] as { id: Section; label: string; icon: IconName }[]).map((item) => <button type="button" key={item.id} aria-current={section === item.id ? "page" : undefined} className={section === item.id ? styles.selected : ""} onClick={() => navigate(item.id)}><Icon name={item.icon} />{item.label}</button>)}
          </nav>
          <div className={styles.help}><h3>Нужна помощь?</h3><p>Ответы на вопросы о публикации и обмене.</p><button type="button" onClick={() => setHelp(true)}>Открыть справку</button></div>
        </aside>
        <div className={styles.content}>
          {own && user?.status === "FROZEN" && <p className={styles.restriction} role="status">Аккаунт заморожен. Управление лотами недоступно. Обратитесь в поддержку.</p>}
          {section === "settings" && own && user ? <ProfileSettings key={user.id} user={user} onSaved={setUser} /> : section === "reviews" ? <ReviewsPanel reviews={reviews} /> : <>
            <div className={styles.contentHeading}><h2>{own ? "Мои лоты" : "Лоты пользователя"}</h2>{own && (canManage ? <Link className={styles.newLot} href="/lots/new">+ Новый лот</Link> : <button type="button" className={styles.newLot} disabled title={user?.status === "FROZEN" ? "Действие недоступно — аккаунт заморожен" : "Подтвердите почту для публикации"}>+ Новый лот</button>)}</div>
            <div className={`${styles.stats} ${!own ? styles.publicStats : ""}`}>
              {([{ label: "Активные", status: "ACTIVE", icon: "active", value: count("ACTIVE") }, ...(own ? [{ label: "На модерации", status: "MODERATION", icon: "moderation", value: count("MODERATION") }, { label: "Архив", status: "ARCHIVED", icon: "archive", value: count("ARCHIVED") }] : []), { label: "Завершённые обмены", status: "COMPLETED", icon: "completed", value: exchanges.length }] as { label: string; status: Filter; icon: string; value: number }[]).map((item) => <button type="button" key={item.status} onClick={() => navigate("lots", item.status)} className={styles.stat}><span>{item.label}</span><strong>{item.value}</strong><Image src={`/images/profile/dot-${item.icon}.svg`} alt="" width={24} height={24} /></button>)}
            </div>
            <nav className={styles.filters} aria-label="Фильтры лотов">{FILTERS.filter((item) => own || item.value === "all" || item.value === "COMPLETED").map((item) => <button type="button" key={item.value} className={filter === item.value ? styles.activeFilter : ""} aria-pressed={filter === item.value} onClick={() => navigate("lots", item.value)}>{item.label}<span>{item.value === "all" ? visibleLots.length : item.value === "COMPLETED" ? exchanges.length : count(item.value)}</span></button>)}</nav>
            {filter === "COMPLETED" ? <CompletedPanel lots={lots} exchanges={exchanges} /> : filteredLots.length ? <div className={styles.lots}>{filteredLots.map((lot, index) => <LotCard key={lot.id} eager={index === 0} lot={lot} own={own} canManage={canManage} onAction={onAction} />)}</div> : <div className={styles.empty}><h3>Здесь пока нет лотов</h3><p>Лоты с выбранным статусом появятся в этом разделе.</p><button type="button" onClick={() => navigate("lots", "all")}>Показать все лоты</button></div>}
          </>}
        </div>
      </div>}
    </main><SiteFooter />
    {help && <HelpDialog onClose={() => setHelp(false)} />}
    {dialog && <LotDialog key={`${dialog.lot.id}:${dialog.action}`} {...dialog} onClose={() => setDialog(null)} onDelete={(id) => { setLots((current) => current.map((item) => item.id === id ? { ...item, status: "DELETED" } : item)); setDialog(null); notify({ kind: "success", title: "Лот удалён" }); }} />}
  </div>;
}
