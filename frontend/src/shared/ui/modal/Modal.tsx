"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import styles from "./Modal.module.scss";

type ModalProps = { title: string; children: ReactNode; onClose: () => void; busy?: boolean; dismissable?: boolean };
export function Modal({ title, children, onClose, busy = false, dismissable = true }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);
  return <dialog className={styles.dialog} ref={ref} aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); if (!busy && dismissable) onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget && !busy && dismissable) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }}>
    <div className={styles.heading}><h2 id={titleId}>{title}</h2>{dismissable && <button type="button" aria-label="Закрыть окно" disabled={busy} onClick={onClose}>×</button>}</div>
    {children}
  </dialog>;
}
