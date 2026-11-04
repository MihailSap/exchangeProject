import Link from "next/link";

import styles from "./CatalogLotCard.module.scss";

import type { CatalogItem } from "../model/discovery";

import { AssetImage } from "@/src/shared/ui/asset-image";

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
      {item.image ? (
        <AssetImage
          src={item.image}
          alt={item.title}
          width={600}
          height={284}
          className={styles.photo}
          eager={eager}
        />
      ) : <span className={styles.photo}>Фотографий пока нет</span>}
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
