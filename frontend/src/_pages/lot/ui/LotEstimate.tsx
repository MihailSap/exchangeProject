import Image from "next/image";

import styles from "./LotEstimate.module.scss";
import { LOT_ESTIMATE, pricePosition, priceVerdict } from "../model/estimate";

import type { CSSProperties } from "react";

type EstimateStyle = CSSProperties & { "--price-position": string };

const format = (price: number) => price.toLocaleString("ru-RU");
export function LotEstimate({ price }: { price: number }) {
  const style: EstimateStyle = { "--price-position": `${pricePosition(price)}%` };

  return (
    <section className={styles.card} aria-labelledby="lot-estimate-heading">
      <div className={styles.heading}>
        <span className={styles.spark} aria-hidden="true">
          <Image src="/images/lot-estimate/spark-circle.svg" alt="" width={28} height={28} />
          <Image src="/images/lot-estimate/spark.svg" alt="" width={14.4} height={14.4} />
        </span>
        <h2 id="lot-estimate-heading">ИИ-оценка</h2>
      </div>
      <div className={styles.body}>
        <p className={styles.caption}>Рекомендуемая стоимость</p>
        <strong className={styles.price}>{format(LOT_ESTIMATE.recommended)} ₽</strong>
        <p className={styles.rangeText}>
          Рыночный диапазон {format(LOT_ESTIMATE.minimum)} – {format(LOT_ESTIMATE.maximum)} ₽
        </p>
        <div
          className={styles.range}
          style={style}
          role="img"
          aria-label={`Ваша оценка ${format(price)} рублей. Рыночный диапазон от ${format(LOT_ESTIMATE.minimum)} до ${format(LOT_ESTIMATE.maximum)} рублей.`}
        >
          <span className={styles.track} />
          <span className={styles.market} />
          <span className={styles.marker} />
          <span className={styles.yourPrice}>Ваша: {format(price)}</span>
        </div>
        <p className={styles.verdict}>
          <span className={styles.check} aria-hidden="true">
            <Image src="/images/lot-estimate/check-circle.svg" alt="" width={18} height={18} />
            <Image src="/images/lot-estimate/check.svg" alt="" width={13.2} height={10.2} />
          </span>
          {priceVerdict(price)}
        </p>
        <p className={styles.disclaimer}>
          Оценка ориентировочная.
          <br />
          Итоговую стоимость указываете вы.
        </p>
      </div>
    </section>
  );
}
