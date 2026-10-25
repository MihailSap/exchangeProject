"use client";

import { useEffect } from "react";
import { SiteHeader, SiteFooter } from "@/src/widgets/site-chrome";
import { Breadcrumbs } from "@/src/shared/ui/breadcrumbs";
import { useLot } from "../model/use-lot";
import { LotForm } from "./LotForm";
import styles from "./LotPage.module.scss";

export function LotEditorPage({ id }: { id?: number }) {
  const { lot, loaded, error, retry, user, router } = useLot(id, true);
  useEffect(() => { if (lot) document.title = `Меняемся - Редактирование: ${lot.title}`; }, [lot]);
  return <div className="sitePage"><SiteHeader ownLot={loaded} /><main className={styles.main}><Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Личный кабинет", href: "/profile" }, ...(lot ? [{ label: lot.title, href: `/lots/${lot.id}` }] : []), { label: id ? "Редактирование лота" : "Новый лот" }]} /><h1>{id ? "Редактировать лот" : "Расскажите о вашей вещи"}</h1>
    {loaded && user ? <LotForm key={lot?.id ?? "new"} lot={lot} user={user} onSaved={(saved) => router.push(`/lots/${saved.id}`)} /> : <section className={styles.loading} aria-live="polite">{error ? <><p>{error}</p><button type="button" onClick={retry}>Повторить</button></> : <p>Загружаем данные…</p>}</section>}
  </main><SiteFooter /></div>;
}
