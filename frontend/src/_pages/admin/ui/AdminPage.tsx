"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readSession, updateSessionProfile, useSession } from "@/src/entities/session";
import { AdminWorkspace, getAdminCategories } from "@/src/features/administration";
import type { AdminCategory } from "@/src/features/administration";
import { ApiError } from "@/src/shared/api/client";
import { Breadcrumbs } from "@/src/shared/ui/breadcrumbs";
import { Icon } from "@/src/shared/ui/icon";
import { SiteFooter, SiteHeader } from "@/src/widgets/site-chrome";
import styles from "./AdminPage.module.scss";

export function AdminPage() {
  const { user, ready } = useSession();
  const router = useRouter();
  const [verified, setVerified] = useState<{ id: number; categories: AdminCategory[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const onDenied = useCallback((error: unknown) => {
    if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) return false;
    setVerified(null);
    router.replace(error.status === 401 ? "/login" : "/");
    return true;
  }, [router]);
  useEffect(() => {
    if (!ready) return;
    let current = true;
    setVerified(null);
    setError(null);
    if (!user) { router.replace("/login"); return; }
    void (async () => {
      const profile = await updateSessionProfile();
      if (!current) return;
      if (profile.status !== "ACTIVE" || readSession()?.user.role !== "ADMIN") { router.replace("/"); return; }
      const categories = await getAdminCategories();
      if (current) setVerified({ id: profile.id, categories });
    })().catch((error: unknown) => {
      if (current && !onDenied(error)) setError(error instanceof Error ? error.message : "Не удалось проверить доступ к панели");
    });
    return () => { current = false; };
  }, [ready, user?.id, user?.status, user?.role, attempt, router, onDenied]);
  const allowed = ready && user?.id === verified?.id && user?.role === "ADMIN" && user.status === "ACTIVE";
  return <div className="sitePage"><SiteHeader /><main className={styles.main}>
    {allowed && verified ? <><Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Админ-панель" }]} /><div className={styles.heading}><span><Icon name="shield" /></span><div><h1>Админ-панель</h1><p>Управление пользователями и справочниками сервиса</p></div></div><AdminWorkspace key={verified.id} userId={verified.id} categories={verified.categories} onDenied={onDenied} /></> : <div className={styles.state} role="status">{error ? <><p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Повторить проверку доступа</button></> : "Проверяем доступ…"}</div>}
  </main><SiteFooter /></div>;
}
