"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "@/src/shared/ui/modal";
import { FormField } from "@/src/shared/ui/form-field";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";
import { reasonError } from "../model/contracts";
import type { AdminUser } from "../model/contracts";
import { setUserFrozen } from "../api/admin-api";
import styles from "./Administration.module.scss";

type Props = { user: AdminUser; onClose: () => void; onSaved: () => void; onDenied: (error: unknown) => boolean };
export function UserStatusDialog({ user, onClose, onSaved, onDenied }: Props) {
  const frozen = user.status !== "FROZEN";
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const error = reasonError(reason);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (busy || (frozen && error)) return;
    setBusy(true);
    try {
      await setUserFrozen(user.id, frozen, reason);
      notify({ kind: "success", title: frozen ? "Пользователь заморожен" : "Пользователь разморожен" });
      onSaved();
    } catch (error) {
      if (!onDenied(error)) notify({ kind: "error", title: error instanceof Error ? error.message : "Не удалось изменить статус пользователя" });
    } finally { setBusy(false); }
  }
  return <Modal title={frozen ? "Заморозить пользователя?" : "Разморозить пользователя?"} onClose={onClose} busy={busy}>
    <form className={styles.dialogForm} onSubmit={submit}>
      <p>{frozen ? "Ограничить доступ к обменам для" : "Восстановить доступ к обменам для"} <strong>{user.name}</strong>?</p>
      {frozen && <FormField label="Причина заморозки" name="freeze-reason" value={reason} onChange={setReason} onBlur={() => setTouched(true)} maxLength={500} error={touched ? error : undefined} required multiline disabled={busy} />}
      <div className={styles.actions}><button className={styles.secondary} type="button" disabled={busy} onClick={onClose}>Отмена</button><button className={frozen ? styles.danger : styles.primary} type="submit" disabled={busy || (frozen && Boolean(error))}>{busy ? "Сохраняем…" : frozen ? "Заморозить" : "Разморозить"}</button></div>
    </form>
  </Modal>;
}
