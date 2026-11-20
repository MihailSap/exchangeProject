"use client";

import { useEffect, useState } from "react";

import { LotForm } from "./LotForm";
import { LotModeration } from "./LotModeration";
import moderationStyles from "./LotModeration.module.scss";
import styles from "./LotPage.module.scss";
import { useLot } from "../model/use-lot";

import type { Lot } from "@/src/entities/lot";

import { getLotPath } from "@/src/entities/lot";
import { Breadcrumbs } from "@/src/shared/ui/breadcrumbs";
import { Loading } from "@/src/shared/ui/loading";
import { SiteHeader, SiteFooter } from "@/src/widgets/site-chrome";

export function LotEditorPage({ id, fixture = false }: { id?: number; fixture?: boolean }) {
  const { lot, setLot, loaded, error, retry, user, router } = useLot(id, true, undefined, fixture);
  const [revision, setRevision] = useState(0);
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
            ...(lot ? [{ label: lot.title, href: getLotPath(lot) }] : []),
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
            <LotForm
              key={`${lot?.id ?? "new"}:${revision}`}
              lot={lot}
              user={user}
              onSaved={setSubmittedLot}
              onUpdated={(next) => {
                setLot(next);
                setRevision((value) => value + 1);
              }}
            />
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
