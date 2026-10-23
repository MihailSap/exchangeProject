"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import styles from "./ToastProvider.module.scss";

export type ToastKind = "success" | "error" | "info";
type ToastInput = { title: string; description?: string; kind: ToastKind; duration?: number };
type ToastItem = ToastInput & { id: number; leaving?: boolean };
type ToastContextValue = { notify: (toast: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 0;

const EXIT_REMOVAL_FALLBACK_MS = 1000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, leaving: true } : item))
    );
    window.setTimeout(() => remove(id), EXIT_REMOVAL_FALLBACK_MS);
  }, [remove]);

  const notify = useCallback((toast: ToastInput) => {
    const id = ++nextToastId;
    setItems((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => dismiss(id), toast.duration ?? 5000);
  }, [dismiss]);

  const value = useMemo(() => ({ notify }), [notify]);

  const handleAnimationEnd = useCallback((item: ToastItem) => () => {
    if (item.leaving) {
      remove(item.id);
    }
  }, [remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} aria-live="polite" aria-relevant="additions removals">
        {items.map((item) => (
          <section
            className={`${styles.toast} ${styles[item.kind]}${item.leaving ? ` ${styles.leaving}` : ""}`}
            key={item.id}
            role={item.kind === "error" ? "alert" : "status"}
            onAnimationEnd={handleAnimationEnd(item)}
          >
            <div className={styles.copy}>
              <strong>{item.title}</strong>
              {item.description && <p>{item.description}</p>}
            </div>
            <button className={styles.close} type="button" aria-label="Закрыть уведомление" onClick={() => dismiss(item.id)}>
              <span aria-hidden="true">×</span>
            </button>
          </section>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}