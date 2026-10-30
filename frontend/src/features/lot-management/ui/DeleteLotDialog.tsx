"use client";

import { useState } from "react";
import { deleteLot } from "@/src/entities/lot";
import type { Lot } from "@/src/entities/lot";
import { Modal } from "@/src/shared/ui/modal";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";
import styles from "./DeleteLotDialog.module.scss";

export function DeleteLotDialog({ lot, onClose, onDelete }: { lot: Lot; onClose: () => void; onDelete: (id: number) => void }) {
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  async function remove() {
    if (busy) return;
    setBusy(true);
    try { await deleteLot(lot); onDelete(lot.id); }
    catch (error) { notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось удалить лот" }); }
    finally { setBusy(false); }
  }
  return <Modal title="Удалить лот?" onClose={onClose} busy={busy}><p className={styles.copy}>Лот «{lot.title}» будет удалён. Отменить действие нельзя.</p><div className={styles.buttons}><button type="button" className={styles.secondary} disabled={busy} onClick={onClose}>Отмена</button><button type="button" className={styles.danger} disabled={busy} onClick={remove}>{busy ? "Удаляем…" : "Удалить лот"}</button></div></Modal>;
}
