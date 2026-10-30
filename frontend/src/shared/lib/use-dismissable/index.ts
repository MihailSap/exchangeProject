"use client";

import { useEffect, useRef } from "react";

export function useDismissable<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) onClose();
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        ref.current?.querySelector<HTMLElement>("button[aria-expanded]")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [onClose, open]);
  return ref;
}
