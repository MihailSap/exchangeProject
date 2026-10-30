import { isRecord } from "@/src/shared/lib/validation";

export function accessTokenRole(token: string): "USER" | "ADMIN" | undefined {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1] || token.length > 16_384) return undefined;
    const payload: unknown = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!isRecord(payload) || typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return undefined;
    return payload.role === "ADMIN" || payload.role === "USER" ? payload.role : undefined;
  } catch {
    return undefined;
  }
}
