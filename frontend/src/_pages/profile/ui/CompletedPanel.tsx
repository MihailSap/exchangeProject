import Image from "next/image";
import Link from "next/link";

import styles from "./CompletedPanel.module.scss";
import { formatDate } from "../model/demo-data";

import type { CompletedExchange } from "../model/demo-data";
import type { Lot } from "@/src/entities/lot";

import { Icon } from "@/src/shared/ui/icon";

export function CompletedPanel({
  lots,
  exchanges,
}: {
  lots: Lot[];
  exchanges: CompletedExchange[];
}) {
  return (
    <div className={styles.list}>
      {exchanges.map((exchange) => {
        const lot = lots.find((item) => item.id === exchange.lotId);
        if (!lot) return null;

        return (
          <article className={styles.card} key={exchange.id}>
            <div className={styles.heading}>
              <span>
                <Icon name="check" />
                Обмен завершён
              </span>
              <time dateTime={exchange.completedAt}>{formatDate(exchange.completedAt)}</time>
            </div>
            <div className={styles.exchange}>
              <div className={styles.item}>
                <Image
                  src={lot.photos[0]?.name ?? "/images/profile/camera.svg"}
                  alt={lot.title}
                  width={130}
                  height={126}
                />
                <div>
                  <span>Передано</span>
                  <h3>
                    <Link href={`/lots/${lot.id}`}>{lot.title}</Link>
                  </h3>
                  <strong>{lot.estimated_cost.toLocaleString("ru-RU")} ₽</strong>
                </div>
              </div>
              <span className={styles.arrow}>
                <Icon name="swap" />
              </span>
              <div className={styles.item}>
                <Image
                  src={exchange.receivedImage}
                  alt={exchange.receivedTitle}
                  width={130}
                  height={126}
                />
                <div>
                  <span>Получено</span>
                  <h3>{exchange.receivedTitle}</h3>
                  <strong>{exchange.receivedCost.toLocaleString("ru-RU")} ₽</strong>
                </div>
              </div>
            </div>
            <p>
              С участником
              {" "}
              <strong>{exchange.partnerName}</strong>
              <Link href="/profile?section=reviews">
                Отзывы об обменах
                {" "}
                <Icon name="arrow" />
              </Link>
            </p>
          </article>
        );
      })}
    </div>
  );
}
