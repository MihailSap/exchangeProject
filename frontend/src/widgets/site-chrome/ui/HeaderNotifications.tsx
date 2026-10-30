"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useNotifications, notificationHref, notificationText } from "@/src/features/notifications";
import type { NotificationCategory } from "@/src/features/notifications";
import { useDismissable } from "@/src/shared/lib/use-dismissable";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";
import { Icon } from "@/src/shared/ui/icon";
import styles from "./HeaderDropdowns.module.scss";

const CATEGORIES: { id: NotificationCategory; label: string }[] = [{ id: "offers", label: "Новые предложения" }, { id: "messages", label: "Сообщения в чате" }, { id: "reviews", label: "Отзывы" }, { id: "information", label: "Информационные" }];
export function HeaderNotifications({ open, onToggle, onClose }: { open: boolean; onToggle: () => void; onClose: () => void }) {
  const { items, settings, markRead, remove, clear, setCategory } = useNotifications();
  const { notify } = useToast();
  const [preferences, setPreferences] = useState(false);
  const unread = items.filter((item) => item.unread).length;
  const ref = useDismissable<HTMLDivElement>(open, onClose);
  return <div className={styles.anchor} ref={ref}>
    <button type="button" className={styles.bell} aria-label={`Уведомления${unread ? `, непрочитанных: ${unread}` : ""}`} aria-expanded={open} aria-controls="header-notifications" onClick={onToggle}><Image src="/images/profile/bell.svg" alt="" width={34} height={34} />{unread > 0 && <span className={styles.badge} aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}</button>
    {open && <section id="header-notifications" className={`${styles.dropdown} ${styles.notifications}`} aria-labelledby="notifications-heading">
      <div className={styles.heading}><h2 id="notifications-heading">Уведомления</h2><button type="button" aria-label="Настройки уведомлений" aria-expanded={preferences} onClick={() => setPreferences((value) => !value)}><Icon name="settings" /></button></div>
      {preferences ? <div className={styles.preferences}><h3>Какие уведомления получать</h3>{CATEGORIES.map((category) => <label key={category.id}><span>{category.label}</span><input type="checkbox" checked={settings[category.id]} onChange={(event) => setCategory(category.id, event.currentTarget.checked)} /></label>)}<p>Важные сообщения об ограничениях аккаунта и модерации приходят всегда.</p><button type="button" onClick={() => setPreferences(false)}>Вернуться к уведомлениям</button></div> : <>
        <div className={styles.tools}><button type="button" disabled={!unread} onClick={() => markRead()}>Прочитать все</button><button type="button" disabled={!items.length} onClick={clear}><Icon name="trash" />Очистить</button></div>
        <div className={styles.notificationList}>{items.length ? items.map((item) => {
          const text = notificationText(item);
          return <article key={item.id} className={`${styles.notification} ${item.unread ? styles.unread : ""}`}>
            <Link href={notificationHref(item)} onClick={(event) => { const href = notificationHref(item); if (href.startsWith("/offers/") || href.startsWith("/chats/")) { event.preventDefault(); markRead(item.id); notify({ kind: "info", title: href.startsWith("/offers/") ? "Предложения обмена пока недоступны" : "Чаты пока недоступны" }); return; } remove(item.id); onClose(); }}><span className={styles.indicator} aria-label={item.unread ? "Не прочитано" : "Прочитано"}>{item.type === "LOT_REJECTED" ? "!" : ""}</span><div><strong>{text.title}</strong><p>{text.text}</p><time dateTime={item.createdAt}>{new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}</time></div></Link>
            {item.unread && <button type="button" className={styles.readButton} aria-label={`Отметить прочитанным: ${text.title}`} onClick={() => markRead(item.id)}><Icon name="check" /></button>}
          </article>;
        }) : <div className={styles.emptyNotifications}><Icon name="check" /><strong>Уведомлений пока нет</strong><p>Здесь появятся новости о ваших лотах и обменах.</p></div>}</div>
      </>}
    </section>}
  </div>;
}
