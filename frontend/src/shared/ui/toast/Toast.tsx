"use client";

import { useCallback, useEffect, useState } from "react";

import styles from "./ToastProvider.module.scss";

import type { ToastItem } from "./toast.types";
import type { CSSProperties } from "react";

type ToastProps = { item: ToastItem; onRemove: (id: number) => void };

type ToastStyle = CSSProperties & { "--toast-duration": string };

export function Toast({ item, onRemove }: ToastProps) {
  const [leaving, setLeaving] = useState(false);
  const dismiss = useCallback(() => setLeaving(true), []);

  useEffect(() => {
    if (leaving) return;

    const timer = window.setTimeout(dismiss, item.duration);

    return () => window.clearTimeout(timer);
  }, [dismiss, item.duration, leaving]);

  useEffect(() => {
    if (!leaving) return;

    const timer = window.setTimeout(() => onRemove(item.id), 1000);

    return () => window.clearTimeout(timer);
  }, [item.id, leaving, onRemove]);

  const style: ToastStyle = { "--toast-duration": `${item.duration}ms` };

  return (
    <section
      className={`${styles.toast} ${styles[item.kind]}${leaving ? ` ${styles.leaving}` : ""}`}
      style={style}
      onAnimationEnd={(event) => {
        if (leaving && event.target === event.currentTarget) onRemove(item.id);
      }}
    >
      <div
        className={styles.copy}
        role={item.kind === "error" ? "alert" : "status"}
        aria-atomic="true"
      >
        <strong>{item.title}</strong>
        {item.description && <p>{item.description}</p>}
      </div>
      <button
        className={styles.close}
        type="button"
        aria-label="Закрыть уведомление"
        onClick={dismiss}
      >
        <span aria-hidden="true">×</span>
      </button>
      <span className={styles.progress} aria-hidden="true" />
    </section>
  );
}
