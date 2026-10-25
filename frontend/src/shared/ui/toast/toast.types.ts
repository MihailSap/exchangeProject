export type ToastKind = "success" | "error" | "info";
export type ToastInput = { title: string; description?: string; kind: ToastKind; duration?: number };
export type ToastItem = ToastInput & { id: number; duration: number };
