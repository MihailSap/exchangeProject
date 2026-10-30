"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LotGallery } from "./LotGallery";
import styles from "./LotPage.module.scss";
import { useLot } from "../model/use-lot";

import type { Lot } from "@/src/entities/lot";

import { archiveLot, republishLot } from "@/src/entities/lot";
import { DeleteLotDialog } from "@/src/features/lot-management";
import { useNotifications } from "@/src/features/notifications";
import { Avatar } from "@/src/shared/ui/avatar";
import { Breadcrumbs } from "@/src/shared/ui/breadcrumbs";
import { Icon } from "@/src/shared/ui/icon";
import { Loading } from "@/src/shared/ui/loading";
import { Stars } from "@/src/shared/ui/stars";
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
export function LotPage({ id, localLot }: { id: number; localLot?: Lot }) {
  const { lot, setLot, loaded, error, retry, user, router } = useLot(id, false, localLot);
  const { notify } = useToast();
  const { receive } = useNotifications();
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const own = !localLot && user?.id === lot?.owner.id;
  useEffect(() => {
    if (lot) document.title = `Меняемся - ${lot.title}`;
  }, [lot]);
  const canManage = user?.status === "ACTIVE" && user.emailConfirmed;

  async function change(action: "archive" | "republish") {
    if (localLot || !lot || busy) return;

    setBusy(true);
    try {
      const updated = action === "archive" ? await archiveLot(lot) : await republishLot(lot);
      setLot(updated);
      if (action === "republish")
        receive({
          id: `republished:${lot.id}:${updated.published_at}`,
          type: "LOT_REPUBLISHED",
          lotId: lot.id,
          lotTitle: lot.title,
          createdAt: new Date().toISOString(),
        });

      notify({
        kind: "success",
        title: action === "archive" ? "Лот перенесён в архив" : "Лот опубликован заново",
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
              <span>{lot.region}</span>
              <span>
                {lot.category.name} · {lot.type === "PRODUCT" ? "Товар" : "Услуга"}
              </span>
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
                  <dl>
                    <dt>Регион</dt>
                    <dd>{lot.region}</dd>
                    <dt>Способ передачи</dt>
                    <dd>{DELIVERY[lot.delivery_method]}</dd>
                    {lot.expires_at && (
                      <>
                        <dt>Активен до</dt>
                        <dd>{new Intl.DateTimeFormat("ru-RU").format(new Date(lot.expires_at))}</dd>
                      </>
                    )}
                  </dl>
                </section>
              </div>
              <aside className={styles.summary}>
                <strong className={styles.price}>
                  {lot.estimated_cost.toLocaleString("ru-RU")} ₽
                </strong>
                <p className={styles.muted}>Оценочная стоимость</p>
                <section>
                  <h2>{own ? "Хочу получить взамен" : "Владелец хочет обменять на"}</h2>
                  <div className={styles.wants}>
                    {lot.wants.length ? (
                      lot.wants.map((want, index) => (
                        <span key={`${want.want_type}:${index}`}>
                          {want.keywords ||
                            want.target_category?.name ||
                            want.target_lot ||
                            "Готов рассмотреть варианты"}
                        </span>
                      ))
                    ) : (
                      <span>Готов рассмотреть варианты</span>
                    )}
                  </div>
                </section>
                {localLot ? (
                  <div className={styles.owner}>
                    <Avatar name={lot.owner.name} />
                    <div>
                      <strong>{lot.owner.name}</strong>
                      <Stars value={lot.owner.rating} />
                    </div>
                  </div>
                ) : (
                  <Link className={styles.owner} href={own ? "/profile" : `/users/${lot.owner.id}`}>
                    <Avatar
                      name={own ? (user?.name ?? lot.owner.name) : lot.owner.name}
                      src={own ? user?.avatarUrl : undefined}
                    />
                    <div>
                      <strong>{own ? user?.name : lot.owner.name}</strong>
                      <Stars value={lot.owner.rating} />
                    </div>
                    <Icon name="chevron" />
                  </Link>
                )}
                <div className={styles.buttons}>
                  {own ? (
                    <>
                      {["ACTIVE", "DRAFT", "REJECTED"].includes(lot.status) &&
                        (canManage ? (
                          <Link href={`/lots/${lot.id}/edit`} className={styles.primary}>
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
                          onClick={() => change("republish")}
                        >
                          Опубликовать заново
                          {" "}
                          <Icon name="arrow" />
                        </button>
                      )}
                      {lot.status === "ACTIVE" && (
                        <button
                          type="button"
                          className={styles.secondary}
                          disabled={!canManage || busy}
                          onClick={() => change("archive")}
                        >
                          В архив
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.danger}
                        disabled={
                          busy || lot.status === "IN_EXCHANGE" || lot.status === "COMPLETED"
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
                        title="Предложения обмена ещё не подключены"
                      >
                        <Icon name="swap" />
                        Предложить обмен
                      </button>
                      <button
                        type="button"
                        className={styles.secondary}
                        disabled
                        title="Переписка ещё не подключена"
                      >
                        Написать владельцу
                      </button>
                      <p className={styles.muted}>
                        Предложения и переписка станут доступны после подключения соответствующего
                        API.
                      </p>
                    </>
                  )}
                </div>
                <p className={styles.note}>
                  <Icon name="check" />
                  Обсудите условия до обмена и проверьте вещь при встрече.
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
