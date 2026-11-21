"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./LotPage.module.scss";
import { parseTargetLot } from "../model/form";

import type { Lot } from "@/src/entities/lot";

import { getLot } from "@/src/entities/lot";
import { AssetImage } from "@/src/shared/ui/asset-image";
import { Icon } from "@/src/shared/ui/icon";

export function LotExchangeDetails({ lot }: { lot: Lot }) {
  const [targets, setTargets] = useState<Record<string, Lot>>({});
  useEffect(() => {
    let current = true;
    const ids = [...new Set(lot.wants.flatMap((want) => {
      const id = want.want_type === "LOT" && want.target_lot ? parseTargetLot(want.target_lot) : null;

      return id ? [id] : [];
    }))];

    void Promise.allSettled(ids.map(async (id) => {
      const target = await getLot(Number(id));
      if (current) setTargets((previous) => ({ ...previous, [id]: target }));
    }));

    return () => {
      current = false;
    };
  }, [lot.wants]);

  const categories = lot.wants.flatMap((want) => want.want_type === "CATEGORY" && want.target_category ? [want.target_category] : []);
  const keywords = lot.wants.flatMap((want) => want.want_type === "KEYWORDS" && want.keywords ? [want.keywords] : []);
  const desired = lot.wants.flatMap((want) => {
    const id = want.want_type === "LOT" && want.target_lot ? parseTargetLot(want.target_lot) : null;

    return id ? [id] : [];
  });

  return (
    <section className={styles.description} aria-label="Пожелания к обмену">
      <h2>Пожелания к обмену</h2>
      {desired.length > 0 && (
        <div className={styles.targetLots}>{desired.map((id) => {
          const target = targets[id];

          return (
            <Link key={id} href={`/lots/${id}`} className={styles.targetLot}>
              {target?.photos[0] ? <AssetImage src={target.photos[0].name} alt="" width={44} height={44} /> : (
                <span className={styles.targetPlaceholder}>
                  <Icon name="lots" />
                </span>
              )}
              <span>
                <strong>{target?.title ?? `Лот №${id}`}</strong>
                {target && <small>{target.region} · {target.owner.name}</small>}
              </span>
            </Link>
          );
        })}
        </div>
      )}
      {categories.length > 0 && (
        <div className={styles.wantRow}>
          <strong>Категории:</strong>
          <div className={styles.wants}>{categories.map((category) => <span key={category.id}>{category.name}</span>)}</div>
        </div>
      )}
      {keywords.length > 0 && (
        <div className={styles.wantRow}>
          <strong>Ключевые слова:</strong>
          <div className={styles.wants}>{keywords.map((word) => <span key={word}>{word}</span>)}</div>
        </div>
      )}
      {(lot.wants.length === 0 || lot.wants.some((want) => want.want_type === "ANY")) && <p>Готов рассмотреть ваши варианты</p>}
    </section>
  );
}
