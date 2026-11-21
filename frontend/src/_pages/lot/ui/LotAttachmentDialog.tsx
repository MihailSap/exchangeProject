"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./LotForm.module.scss";

import type { Lot } from "@/src/entities/lot";

import { deleteLotAttachment } from "@/src/entities/lot";
import { ApiError } from "@/src/shared/api/client";
import { Modal } from "@/src/shared/ui/modal";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";

export type LotAttachment = { kind: "photo" | "want"; id: number; label: string };

export function LotAttachmentDialog({ lot, attachment, onClose, onRemoved }: { lot: Lot; attachment: LotAttachment; onClose: () => void; onRemoved: (next: Lot) => void }) {
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const router = useRouter();

  async function remove() {
    if (busy) return;

    setBusy(true);
    try {
      await deleteLotAttachment(lot, attachment.kind, attachment.id);
      onRemoved(attachment.kind === "photo" ? { ...lot, photos: lot.photos.filter((photo) => photo.id !== attachment.id) } : { ...lot, wants: lot.wants.filter((want) => want.id !== attachment.id) });
      notify({ kind: "success", title: attachment.kind === "photo" ? "Фотография удалена" : "Вариант обмена удалён" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) router.replace("/login");

      if (error instanceof ApiError && error.status === 403) router.replace("/");

      notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось удалить вложение" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Удалить сохранённое вложение?" busy={busy} onClose={onClose}>
      <div className={styles.attachmentDialog}>
        <p>Вложение «{attachment.label}» будет удалено сразу. Отмена редактирования не вернёт вложение.</p>
        <div>
          <button type="button" className={styles.secondary} disabled={busy} onClick={onClose}>Отмена</button>
          <button type="button" className={styles.primary} disabled={busy} onClick={() => void remove()}>{busy ? "Удаляем…" : "Удалить"}</button>
        </div>
      </div>
    </Modal>
  );
}
