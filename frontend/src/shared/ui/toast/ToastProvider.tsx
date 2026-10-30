"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { Toast } from "./Toast";
import styles from "./ToastProvider.module.scss";

import type { ToastInput, ToastItem } from "./toast.types";
import type { ReactNode } from "react";

export type { ToastKind } from "./toast.types";

type ToastContextValue = { notify: (toast: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((toast: ToastInput) => {
    const duration = Number.isFinite(toast.duration) ? Math.max(0, toast.duration ?? 10000) : 10000;
    const id = ++nextToastId;
    setItems((current) => [...current.slice(-2), { ...toast, duration, id }]);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region}>
        {items.map((item) => (
          <Toast key={item.id} item={item} onRemove={remove} />
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
