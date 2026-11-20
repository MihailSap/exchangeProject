"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./LotSavedAttachments.module.scss";

import type { Lot } from "@/src/entities/lot";

import { deleteLotAttachment } from "@/src/entities/lot";
import { ApiError } from "@/src/shared/api/client";
import { Modal } from "@/src/shared/ui/modal";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

type Attachment = { kind: "photo" | "want"; id: number; label: string };

type Props = { lot: Lot; disabled: boolean; onUpdated: (lot: Lot) => void };

export function LotSavedAttachments({ lot, disabled, onUpdated }: Props) {
  const [selected, setSelected] = useState<Attachment | null>(null);
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const router = useRouter();
  const items: Attachment[] = [
    ...lot.photos.map((photo, index): Attachment => ({ kind: "photo", id: photo.id, label: `Фото ${index + 1}${index === 0 ? " — обложка" : ""}` })),
    ...lot.wants.flatMap((want): Attachment[] => want.id === undefined ? [] : [{
      kind: "want",
      id: want.id,
      label: want.keywords || want.target_category?.name || (want.target_lot ? `Лот №${want.target_lot}` : "Рассмотрю ваши варианты"),
    }]),
  ];

  async function remove() {
    if (!selected || busy || disabled) return;

    setBusy(true);
    try {
      await deleteLotAttachment(lot, selected.kind, selected.id);
      const next = selected.kind === "photo"
        ? { ...lot, photos: lot.photos.filter((photo) => photo.id !== selected.id) }
        : { ...lot, wants: lot.wants.filter((want) => want.id !== selected.id) };

      setSelected(null);
      onUpdated(next);
      notify({ kind: "success", title: selected.kind === "photo" ? "Фотография удалена" : "Вариант обмена удалён" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) router.replace("/login");

      if (error instanceof ApiError && error.status === 403) router.replace("/");

      notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось удалить вложение" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.panel} aria-label="Сохранённые вложения">
      <h2>Сохранённые фото и варианты обмена</h2>
      <p>Удаление применяется сразу после подтверждения. Нужно оставить хотя бы одно сохранённое фото и один вариант обмена. Новые добавляются при отправке формы.</p>
      {disabled && <p role="status">Чтобы удалить вложение, сначала сохраните изменения формы или заново откройте редактор.</p>}
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={`${item.kind}:${item.id}`}>
            <span>{item.label}</span>
            <button
              type="button"
              disabled={disabled || busy || (item.kind === "photo" ? lot.photos.length : lot.wants.length) <= 1}
              aria-label={`Удалить: ${item.label}`}
              onClick={() => setSelected(item)}
            >
              Удалить
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <Modal title="Удалить сохранённое вложение?" busy={busy} onClose={() => setSelected(null)}>
          <p>«{selected.label}» будет удалено из лота сразу. Отмена редактирования не вернёт вложение.</p>
          <div className={styles.actions}>
            <button type="button" disabled={busy} onClick={() => setSelected(null)}>Отмена</button>
            <button type="button" disabled={busy || disabled} onClick={() => void remove()}>{busy ? "Удаляем…" : "Удалить"}</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
