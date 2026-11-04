import type { Lot } from "./lot";

export function wantKey(want: Lot["wants"][number]): string {
  return JSON.stringify([
    want.want_type,
    want.keywords,
    want.target_category?.id ?? null,
    want.target_lot,
  ]);
}

export function sameWants(first: Lot["wants"], second: Lot["wants"]): boolean {
  return JSON.stringify(first.map(wantKey).sort()) === JSON.stringify(second.map(wantKey).sort());
}
