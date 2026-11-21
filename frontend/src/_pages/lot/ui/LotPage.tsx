"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LotExchangeDetails } from "./LotExchangeDetails";
import { LotGallery } from "./LotGallery";
import { LotOwner } from "./LotOwner";
import styles from "./LotPage.module.scss";
import { LOT_ESTIMATE } from "../model/estimate";
import { useLot } from "../model/use-lot";

import type { Lot } from "@/src/entities/lot";

import { getLotPath, republishLot } from "@/src/entities/lot";
import { DeleteLotDialog } from "@/src/features/lot-management";
import { useNotifications } from "@/src/features/notifications";
import { Breadcrumbs } from "@/src/shared/ui/breadcrumbs";
import { Icon } from "@/src/shared/ui/icon";
import { Loading } from "@/src/shared/ui/loading";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";
import { SiteHeader, SiteFooter } from "@/src/widgets/site-chrome";

const LABELS = {
  DRAFT: "Черновик",
  ACTIVE: "Активен",
  MODERATION: "На модерации",
  REJECTED: "Отклонён",
  ARCHIVED: "В архиве",
  IN_EXCHANGE: "В обмене",
  COMPLETED: "Обмен завершён",
  DELETED: "Удалён",
};

const DELIVERY = { BOTH: "Доставка и самовывоз", DELIVERY: "Доставка", PICKUP: "Самовывоз" };
export function LotPage({ id, localLot, fixture = false }: { id: number; localLot?: Lot; fixture?: boolean }) {
  const { lot, setLot, loaded, error, retry, user, router } = useLot(id, false, localLot, fixture);
  const { notify } = useToast();
  const { receive } = useNotifications();
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const own = !localLot && user?.id === lot?.owner.id;
  useEffect(() => {
    if (lot) document.title = `Меняемся - ${lot.title}`;
  }, [lot]);
  const canManage = user?.status === "ACTIVE" && user.emailConfirmed;

  async function republish() {
    if (localLot || !lot || busy) return;

    setBusy(true);
    try {
      const updated = await republishLot(lot);
      setLot(updated);
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`sitePage ${styles.page}`}>
      <SiteHeader ownLot={loaded && own} />
      <main className={styles.main}>
        <Breadcrumbs
          items={[
            { label: "Главная", href: "/" },
            {
              label: localLot ? "Каталог" : own || !lot ? "Личный кабинет" : lot.owner.name,
              href: localLot ? "/catalog" : own || !lot ? "/profile" : `/users/${lot.owner.id}`,
            },
            { label: lot?.title ?? "Лот" },
          ]}
        />
        {!loaded || !lot ? (
          <section className={styles.loading} aria-live="polite">
            {error ? (
              <>
                <h1>Не удалось загрузить лот</h1>
                <p>{error}</p>
                <button type="button" onClick={retry}>
                  Повторить
                </button>
              </>
            ) : (
              <Loading label="Загружаем лот…" />
            )}
          </section>
        ) : (
          <>
            <h1>{lot.title}</h1>
            <div className={styles.meta}>
              <span className={`${styles.status} ${styles[lot.status]}`}>{LABELS[lot.status]}</span>
              {lot.published_at && (
                <time dateTime={lot.published_at}>
                  Опубликован {new Intl.DateTimeFormat("ru-RU").format(new Date(lot.published_at))}
                </time>
              )}
            </div>
            <div className={styles.layout}>
              <div className={styles.details}>
                <LotGallery key={lot.id} lot={lot} />
                <section className={styles.description}>
                  <h2>Описание</h2>
                  <p>{lot.description || "Описание не добавлено"}</p>

                </section>
                <LotExchangeDetails lot={lot} />
              </div>
              <aside className={styles.summary}>
                <strong className={styles.price}>
                  {lot.estimated_cost.toLocaleString("ru-RU")} ₽
                </strong>
                <p className={styles.muted}>
                  ИИ-оценка:
                  {" "}
                  {LOT_ESTIMATE.recommended.toLocaleString("ru-RU")}
                  {" "}
                  ₽
                  <br />
                  Рыночный диапазон:
                  {" "}
                  {LOT_ESTIMATE.minimum.toLocaleString("ru-RU")}
                  –
                  {LOT_ESTIMATE.maximum.toLocaleString("ru-RU")}
                  {" "}
                  ₽
                </p>
                <section className={styles.lotDetails}>
                  <h2>Детали лота</h2>
                  <dl>
                    <dt>Тип предложения</dt>
                    <dd>{lot.type === "PRODUCT" ? "Товар" : "Услуга"}</dd>
                    <dt>Категория</dt>
                    <dd>{lot.category.name}</dd>
                    <dt>Регион</dt>
                    <dd>{lot.region}</dd>
                    <dt>Способ передачи</dt>
                    <dd>{DELIVERY[lot.delivery_method]}</dd>
                  </dl>
                </section>
                <LotOwner key={lot.owner.id} lot={lot} user={user} own={own} local={Boolean(localLot)} />
                <div className={styles.buttons}>
                  {own ? (
                    <>
                      {["ACTIVE", "DRAFT", "REJECTED", "MODERATION"].includes(lot.status) &&
                        (canManage ? (
                          <Link href={`${getLotPath(lot)}/edit`} className={styles.primary}>
                            Редактировать
                            {" "}
                            <Icon name="arrow" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className={styles.primary}
                            title="Подтвердите почту для управления лотами"
                          >
                            Редактировать
                          </button>
                        ))}
                      {lot.status === "ARCHIVED" && (
                        <button
                          type="button"
                          className={styles.primary}
                          disabled={!canManage || busy}
                          onClick={() => void republish()}
                        >
                          Опубликовать заново
                          {" "}
                          <Icon name="arrow" />
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.danger}
                        disabled={
                          busy || !canManage || lot.status === "IN_EXCHANGE" || lot.status === "COMPLETED"
                        }
                        onClick={() => setDeleting(true)}
                      >
                        <Icon name="trash" />
                        Удалить лот
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.primary}
                        disabled
                      >
                        <Icon name="swap" />
                        Предложить обмен
                      </button>
                      <button
                        type="button"
                        className={styles.secondary}
                        disabled
                      >
                        Написать владельцу
                      </button>
                    </>
                  )}
                </div>
                <p className={styles.note}>
                  <Icon name="check" />
                  Обсудите условия до обмена
                </p>
              </aside>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
      {!localLot && deleting && lot && (
        <DeleteLotDialog
          lot={lot}
          onClose={() => setDeleting(false)}
          onDelete={() => {
            setDeleting(false);
            notify({ kind: "success", title: "Лот удалён" });
            router.replace("/profile");
          }}
        />
      )}
    </div>
  );
}
