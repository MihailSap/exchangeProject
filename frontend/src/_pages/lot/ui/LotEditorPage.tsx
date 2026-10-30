"use client";

import { useEffect, useState } from "react";

import { LotForm } from "./LotForm";
import { LotModeration } from "./LotModeration";
import moderationStyles from "./LotModeration.module.scss";
import styles from "./LotPage.module.scss";
import { useLot } from "../model/use-lot";

import type { Lot } from "@/src/entities/lot";

import { Breadcrumbs } from "@/src/shared/ui/breadcrumbs";
import { Loading } from "@/src/shared/ui/loading";
import { SiteHeader, SiteFooter } from "@/src/widgets/site-chrome";

export function LotEditorPage({ id }: { id?: number }) {
  const { lot, loaded, error, retry, user, router } = useLot(id, true);
  const [submittedLot, setSubmittedLot] = useState<Lot | null>(null);
  useEffect(() => {
    document.title = submittedLot
      ? "Меняемся - Лот отправлен на модерацию"
      : lot
        ? `Меняемся - Редактирование: ${lot.title}`
        : "Меняемся - Новый лот";
  }, [lot, submittedLot]);

  return (
    <div className="sitePage">
      <SiteHeader ownLot={loaded} />
      <main className={`${styles.main} ${submittedLot ? moderationStyles.page : ""}`}>
        <Breadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "Личный кабинет", href: "/profile" },
            ...(lot ? [{ label: lot.title, href: `/lots/${lot.id}` }] : []),
            { label: id ? "Редактирование лота" : "Новый лот" },
          ]}
        />
        <h1>
          {submittedLot
            ? "Лот отправлен на модерацию"
            : id
              ? "Редактировать лот"
              : "Расскажите о вашей вещи"}
        </h1>
        {loaded && user ? (
          submittedLot ? (
            <LotModeration
              lot={submittedLot}
              onCreateAnother={() => {
                if (id) router.push("/lots/new");
                else setSubmittedLot(null);
              }}
            />
          ) : (
            <LotForm key={lot?.id ?? "new"} lot={lot} user={user} onSaved={setSubmittedLot} />
          )
        ) : (
          <section className={styles.loading} aria-live="polite">
            {error ? (
              <>
                <p>{error}</p>
                <button type="button" onClick={retry}>
                  Повторить
                </button>
              </>
            ) : (
              <Loading label="Загружаем данные…" />
            )}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
