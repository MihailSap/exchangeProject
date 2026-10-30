import Image from "next/image";
import Link from "next/link";

import styles from "./CatalogLotCard.module.scss";

import type { CatalogItem } from "../model/discovery";

export function CatalogLotCard({
  item,
  spacious = false,
  eager = false,
}: {
  item: CatalogItem;
  spacious?: boolean;
  eager?: boolean;
}) {
  return (
    <Link
      href={`/lots/${encodeURIComponent(item.id)}`}
      className={`${styles.card} ${spacious ? styles.spacious : ""}`}
      aria-label={`Посмотреть лот: ${item.title}`}
    >
      <Image
        src={item.image}
        alt={item.title}
        width={600}
        height={284}
        className={styles.photo}
        loading={eager ? "eager" : "lazy"}
        sizes="(max-width: 600px) 90vw, (max-width: 1100px) 45vw, 30vw"
      />
      <span className={styles.body}>
        <strong className={styles.title}>{item.title}</strong>
        <span className={styles.meta}>
          {item.category} · {item.region}
        </span>
        <strong className={styles.price}>{item.cost.toLocaleString("ru-RU")} ₽</strong>
      </span>
    </Link>
  );
}
