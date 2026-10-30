"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./LotModeration.module.scss";
import { LotStepper } from "./LotStepper";

import type { Lot } from "@/src/entities/lot";

import { getLot } from "@/src/entities/lot";
import { AssetImage } from "@/src/shared/ui/asset-image";
import { Icon } from "@/src/shared/ui/icon";

const asset = (name: string) => `/images/lot-moderation/${name}.svg`;
export function LotModeration({ lot, onCreateAnother }: { lot: Lot; onCreateAnother: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const cover = [...lot.photos].sort((a, b) => a.order - b.order)[0];
  const [targetTitles, setTargetTitles] = useState<Record<string, string>>({});
  useEffect(() => {
    heading.current?.focus();
    let active = true;
    for (const want of lot.wants) {
      if (want.want_type !== "LOT" || !want.target_lot || !/^\d+$/.test(want.target_lot)) continue;

      const target = want.target_lot;
      void getLot(Number(target))
        .then((value) => {
          if (active) setTargetTitles((current) => ({ ...current, [target]: value.title }));
        })
        .catch(() => undefined);
    }

    return () => {
      active = false;
    };
  }, [lot]);

  return (
    <>
      <LotStepper step={3} submitted />
      <div className={styles.layout}>
        <section className={styles.card} aria-labelledby="moderation-heading">
          <div className={styles.hero}>
            <div className={styles.clock} aria-hidden="true">
              <Image src={asset("clock-background")} alt="" width={80} height={80} />
              <Image
                className={styles.clockFace}
                src={asset("clock-face")}
                alt=""
                width={36}
                height={36}
              />
              <Image
                className={styles.clockHands}
                src={asset("clock-hands")}
                alt=""
                width={9.50021}
                height={16.5002}
              />
            </div>
            <h2 id="moderation-heading" ref={heading} tabIndex={-1}>
              Мы проверяем ваш лот
            </h2>
            <p>
              Обычно проверка занимает до 24 часов. Когда лот будет опубликован, мы пришлём
              уведомление, и он появится в каталоге.
            </p>
          </div>
          <section className={styles.publication} aria-labelledby="publication-heading">
            <h3 id="publication-heading">Статус публикации</h3>
            <ol className={styles.timeline}>
              <li className={styles.sent}>
                <span className={styles.marker} aria-hidden="true">
                  <Image src={asset("sent-marker")} alt="" width={28} height={28} />
                  <Image
                    className={styles.check}
                    src={asset("check")}
                    alt=""
                    width={13}
                    height={10}
                  />
                </span>
                <div>
                  <strong>Лот отправлен</strong>
                  <p>Информация и варианты обмена заполнены</p>
                </div>
              </li>
              <li aria-current="step">
                <span className={styles.marker} aria-hidden="true">
                  <Image src={asset("current-marker")} alt="" width={28} height={28} />
                  <Image
                    className={styles.dot}
                    src={asset("current-dot")}
                    alt=""
                    width={10}
                    height={10}
                  />
                </span>
                <div>
                  <strong>Проверка модератором</strong>
                  <p>Сейчас · обычно до 24 часов</p>
                </div>
              </li>
              <li className={styles.pending}>
                <span className={styles.marker} aria-hidden="true">
                  <Image src={asset("pending-marker")} alt="" width={28} height={28} />
                  <span>3</span>
                </span>
                <div>
                  <strong>Публикация в каталоге</strong>
                  <p>Лот станет доступен для предложений обмена</p>
                </div>
              </li>
            </ol>
          </section>
          <section className={styles.summary} aria-label="Ваш лот">
            <p className={styles.caption}>Ваш лот</p>
            <div className={styles.lot}>
              <Link className={styles.lotLink} href={`/lots/${lot.id}`}>
                <span className={styles.thumb}>
                  {cover ? (
                    <AssetImage src={cover.name} alt="" width={44} height={44} eager />
                  ) : (
                    <Icon name="lots" />
                  )}
                </span>
                <span>
                  <strong>{lot.title}</strong>
                  <small>
                    {lot.category.name} · {lot.region} ·{" "}
                    {lot.estimated_cost.toLocaleString("ru-RU")} ₽
                  </small>
                </span>
              </Link>
              <span className={styles.badge}>На модерации</span>
            </div>
            <div className={styles.exchange}>
              <p className={styles.caption}>Готов обменять на</p>
              <ul>
                {lot.wants.map((want, index) => (
                  <li
                    className={want.want_type === "KEYWORDS" ? styles.textWant : undefined}
                    key={`${want.want_type}:${index}`}
                  >
                    {want.want_type === "ANY"
                      ? "Рассмотрю ваши варианты"
                      : want.want_type === "KEYWORDS"
                        ? want.keywords
                        : want.want_type === "CATEGORY"
                          ? want.target_category?.name
                          : (targetTitles[want.target_lot ?? ""] ?? `Лот №${want.target_lot}`)}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </section>
        <aside className={styles.aside}>
          <section className={styles.next}>
            <h2>Что будет дальше</h2>
            <ol>
              <li>Мы проверим фото, описание и условия обмена.</li>
              <li>Результат придёт уведомлением и на email.</li>
              <li>После публикации лот появится в каталоге и станет доступен для предложений.</li>
            </ol>
            <p className={styles.note}>Статус лота можно посмотреть в разделе «Мои лоты».</p>
          </section>
          <section className={styles.actions} aria-label="Действия после отправки">
            <Link className={styles.primary} href="/profile?status=MODERATION">
              К моим лотам
              {" "}
              <Icon name="arrow" />
            </Link>
            <button type="button" className={styles.secondary} onClick={onCreateAnother}>
              Разместить ещё один лот
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
