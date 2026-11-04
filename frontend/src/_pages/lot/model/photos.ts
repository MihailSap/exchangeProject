import type { Lot } from "@/src/entities/lot";

import { storeLocalImage } from "@/src/shared/lib/local-images";

export type LotPhotoSelection =
  | { kind: "existing"; key: string; photo: Lot["photos"][number] }
  | { kind: "file"; key: string; file: File };
export function initialPhotos(lot: Lot | null): LotPhotoSelection[] {
  return [...(lot?.photos ?? [])]
    .sort((a, b) => a.id - b.id)
    .map((photo) => ({ kind: "existing", key: `${photo.id}:${photo.name}`, photo }));
}
export function photosChanged(lot: Lot, selection: LotPhotoSelection[]): boolean {
  const original = [...lot.photos].sort((a, b) => a.id - b.id);

  return (
    original.length !== selection.length ||
    selection.some(
      (item, index) => item.kind === "file" || item.photo.name !== original[index]?.name,
    )
  );
}
export async function serializePhotos(selection: LotPhotoSelection[]): Promise<Lot["photos"]> {
  return Promise.all(
    selection.map(async (item, index) => ({
      id: index + 1,
      name: item.kind === "existing" ? item.photo.name : await storeLocalImage(item.file),
    })),
  );
}
