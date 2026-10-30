"use client";

import Link from "next/link";
import { AssetImage } from "@/src/shared/ui/asset-image";
import { Icon } from "@/src/shared/ui/icon";
import { useCallback, useState } from "react";
import type { Lot } from "@/src/entities/lot";
import { useDismissable } from "@/src/shared/lib/use-dismissable";
import { LOT_STATUS_LABELS } from "../model/demo-data";
import styles from "./LotCard.module.scss";

export type LotAction = "edit" | "delete" | "archive" | "republish" | "view";
export function LotCard({ lot, own, canManage, onAction, eager = false }: { lot: Lot; eager?: boolean; own: boolean; canManage: boolean; onAction: (action: LotAction, lot: Lot) => void }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismissable<HTMLDivElement>(open, close);
  const editable = canManage && (lot.status === "ACTIVE" || lot.status === "DRAFT" || lot.status === "REJECTED");
  const choose = (action: LotAction) => { setOpen(false); onAction(action, lot); };
  return <article className={styles.card}>
    <Link className={styles.imageButton} href={`/lots/${lot.id}`} aria-label={`Посмотреть лот: ${lot.title}`}><AssetImage src={lot.photos[0]?.name ?? "/images/profile/camera.svg"} alt={lot.title} width={130} height={126} eager={eager} /></Link>
    <div className={styles.copy}><Link className={styles.title} href={`/lots/${lot.id}`}>{lot.title}</Link><p>{lot.category.name} · {lot.region}</p><strong>{lot.estimated_cost.toLocaleString("ru-RU")} ₽</strong><span className={`${styles.status} ${styles[lot.status]}`}>{LOT_STATUS_LABELS[lot.status]}</span></div>
    <div className={styles.actions}>{own ? <>
      {lot.status === "ARCHIVED" ? <button type="button" disabled={!canManage} className={styles.action} onClick={() => choose("republish")}>Опубликовать заново <Icon name="arrow" /></button> : editable ? <Link className={styles.action} href={`/lots/${lot.id}/edit`}>Редактировать <Icon name="arrow" /></Link> : <button type="button" className={styles.action} disabled title="Редактирование недоступно для текущего статуса лота или аккаунта">Редактировать <Icon name="arrow" /></button>}
      <div className={styles.menuWrap} ref={ref}><button type="button" className={styles.more} aria-label={`Действия с лотом: ${lot.title}`} aria-expanded={open} aria-controls={`lot-menu-${lot.id}`} onClick={() => setOpen((value) => !value)}>•••</button>
        {open && <div id={`lot-menu-${lot.id}`} className={styles.menu} aria-label="Действия с лотом">
          {editable ? <Link href={`/lots/${lot.id}/edit`}>Редактировать</Link> : <button type="button" disabled>Редактировать</button>}
          {lot.status === "ARCHIVED" && <button type="button" disabled={!canManage} onClick={() => choose("republish")}>Опубликовать заново</button>}
          <button type="button" disabled={!canManage || lot.status !== "ACTIVE"} onClick={() => choose("archive")}>В архив</button>
          <button type="button" className={styles.danger} onClick={() => choose("delete")}>Удалить</button>
        </div>}
      </div>
    </> : <Link className={styles.action} href={`/lots/${lot.id}`}>Посмотреть лот <Icon name="arrow" /></Link>}</div>
  </article>;
}
