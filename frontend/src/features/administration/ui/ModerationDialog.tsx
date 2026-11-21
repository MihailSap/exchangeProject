"use client";

import { useState } from "react";

import styles from "./Administration.module.scss";
import dialogStyles from "./ModerationDialog.module.scss";
import { moderateLot } from "../api/admin-api";
import { reasonError } from "../model/contracts";

import type { Lot } from "@/src/entities/lot";

import { AssetImage } from "@/src/shared/ui/asset-image";
import { FormField } from "@/src/shared/ui/form-field";
import { Modal } from "@/src/shared/ui/modal";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

type Props = { lot: Lot; onClose: () => void; onSaved: () => void; onDenied: (error: unknown) => boolean };

export function ModerationDialog({ lot, onClose, onSaved, onDenied }: Props) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const error = reasonError(reason);

  async function save(action: "approve" | "reject") {
    if (busy || (action === "reject" && error)) return;

    setBusy(true);
    try {
      await moderateLot(lot.id, action, reason);
      notify({ kind: "success", title: action === "approve" ? "Лот опубликован" : "Лот отклонён" });
      onSaved();
    } catch (error) {
      if (!onDenied(error)) notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось сохранить решение" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Проверка лота №${lot.id}`} size="wide" busy={busy} onClose={onClose}>
      <div className={dialogStyles.layout}>
        <section className={dialogStyles.photos} aria-label="Фотографии лота">
          {lot.photos.map((photo, index) => <AssetImage key={photo.id} src={photo.name} alt={`Фото ${index + 1}: ${lot.title}`} width={520} height={320} />)}
        </section>
        <div className={`${styles.dialogForm} ${dialogStyles.content}`}>
          <h3>{lot.title}</h3>
          <p className={styles.description}>{lot.description}</p>
          <dl className={styles.lotDetails}>
            <dt>Владелец</dt>
            <dd>{lot.owner.name}</dd>
            <dt>Стоимость</dt>
            <dd>{lot.estimated_cost.toLocaleString("ru-RU")} ₽</dd>
            <dt>Тип</dt>
            <dd>{lot.type === "PRODUCT" ? "Товар" : "Услуга"}</dd>
            <dt>Категория</dt>
            <dd>{lot.category.name}</dd>
            <dt>Регион</dt>
            <dd>{lot.region}</dd>
            <dt>Передача</dt>
            <dd>{{ BOTH: "Доставка и самовывоз", DELIVERY: "Доставка", PICKUP: "Самовывоз" }[lot.delivery_method]}</dd>
          </dl>
          <div>
            <strong>Пожелания к обмену</strong>
            <ul>{lot.wants.map((want, index) => <li key={want.id ?? index}>{want.keywords || want.target_category?.name || (want.target_lot ? `Лот №${want.target_lot}` : "Готов рассмотреть ваши варианты")}</li>)}</ul>
          </div>
          {rejecting && <FormField name="moderation-reason" label="Причина отклонения" maxLength={500} value={reason} onChange={setReason} onBlur={() => setTouched(true)} error={touched ? error : undefined} disabled={busy} required multiline />}
          <div className={`${styles.actions} ${dialogStyles.actions}`}>
            {rejecting ? (
              <>
                <button type="button" className={styles.secondary} disabled={busy} onClick={() => setRejecting(false)}>Назад</button>
                <button type="button" className={styles.danger} disabled={busy || Boolean(error)} onClick={() => void save("reject")}>{busy ? "Сохраняем…" : "Подтвердить отклонение"}</button>
              </>
            ) : (
              <>
                <button type="button" className={styles.dangerOutline} disabled={busy} onClick={() => setRejecting(true)}>Отклонить</button>
                <button type="button" className={styles.primary} disabled={busy} onClick={() => void save("approve")}>{busy ? "Публикуем…" : "Одобрить и опубликовать"}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
