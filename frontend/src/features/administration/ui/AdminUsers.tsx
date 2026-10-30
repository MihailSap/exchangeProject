"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "@/src/shared/api/client";
import { Avatar } from "@/src/shared/ui/avatar";
import { Icon } from "@/src/shared/ui/icon";
import { getAdminUsers } from "../api/admin-api";
import type { AdminUser, UsersPage } from "../model/contracts";
import { UserStatusDialog } from "./UserStatusDialog";
import styles from "./Administration.module.scss";

type Props = { userId: number; active: boolean; onDenied: (error: unknown) => boolean };
export function AdminUsers({ userId, active, onDenied }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<UsersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  useEffect(() => {
    if (!active) return;
    let current = true;
    setLoading(true);
    setError(null);
    void getAdminUsers(page, filter).then((data) => {
      if (!current) return;
      if (data.page !== page) throw new ApiError("Сервер вернул другую страницу пользователей", 502);
      if (page > 0 && data.totalPages <= page) { setPage(Math.max(0, data.totalPages - 1)); return; }
      setResult(data);
    }).catch((error: unknown) => {
      if (!current || onDenied(error)) return;
      setResult(null);
      setError(error instanceof ApiError && error.status === 404 ? "Список пользователей пока недоступен: на сервере не подключён маршрут получения пользователей. Раздел заработает после подключения API." : error instanceof Error ? error.message : "Не удалось загрузить пользователей");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, filter, attempt, onDenied, active]);
  function search(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(0); setFilter(query.trim()); }
  return <section className={styles.panel} aria-labelledby="admin-users-title">
    <div className={styles.heading}><div><h2 id="admin-users-title">Пользователи</h2><p>Управление аккаунтами и доступом к сервису</p></div>{!loading && result && <span className={styles.counter}>{result.totalElements}</span>}</div>
    <form className={styles.search} onSubmit={search}><label htmlFor="admin-user-search" className={styles.srOnly}>Поиск пользователей</label><Icon name="search" /><input id="admin-user-search" type="search" maxLength={120} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Имя или электронная почта" /><button type="submit" className={styles.primary}>Найти</button></form>
    {loading ? <p className={styles.state} role="status">Загружаем пользователей…</p> : error ? <div className={styles.state} role="status"><p>{error}</p><button type="button" className={styles.secondary} onClick={() => setAttempt((value) => value + 1)}>Повторить загрузку</button></div> : result && <>
      {result.content.length === 0 ? <p className={styles.state}>Пользователи не найдены</p> : <div className={styles.userList}>{result.content.map((user) => <article className={styles.userCard} key={user.id}>
        <div className={styles.identity}><Avatar name={user.name} src={user.avatarUrl} /><div><Link href={user.id === userId ? "/profile" : `/users/${user.id}`}>{user.name}</Link><span>{user.email}</span><small>Регистрация: {new Intl.DateTimeFormat("ru-RU").format(new Date(user.createdAt))}</small></div></div>
        <div className={styles.badges}><span className={user.status === "FROZEN" ? styles.frozen : styles.active}>{user.status === "FROZEN" ? "Заморожен" : "Активен"}</span><span className={user.role === "ADMIN" ? styles.adminBadge : styles.badge}>{user.role === "ADMIN" ? "Администратор" : "Пользователь"}</span><small>{user.emailConfirmed ? "Почта подтверждена" : "Почта не подтверждена"}</small></div>
        <button type="button" className={user.status === "FROZEN" ? styles.secondary : styles.dangerOutline} disabled={user.id === userId} title={user.id === userId ? "Нельзя заморозить собственный аккаунт" : undefined} onClick={() => setSelected(user)}>{user.status === "FROZEN" ? "Разморозить" : "Заморозить"}</button>
      </article>)}</div>}
      {result.totalPages > 1 && <nav className={styles.pagination} aria-label="Страницы пользователей"><button className={styles.secondary} type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><Icon name="back" />Назад</button><span>{page + 1} из {result.totalPages}</span><button className={styles.secondary} type="button" disabled={page + 1 >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Далее<Icon name="arrow" /></button></nav>}
    </>}
    {selected && <UserStatusDialog user={selected} onClose={() => setSelected(null)} onDenied={onDenied} onSaved={() => { setSelected(null); setAttempt((value) => value + 1); }} />}
  </section>;
}
