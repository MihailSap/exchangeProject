"use client";

import { useState } from "react";
import { AssetImage } from "@/src/shared/ui/asset-image";
import { Icon } from "@/src/shared/ui/icon";
import type { Lot } from "@/src/entities/lot";
import styles from "./LotGallery.module.scss";

export function LotGallery({ lot }: { lot: Lot }) {
  const photos = [...lot.photos].sort((a, b) => a.order - b.order);
  const [index, setIndex] = useState(0);
  const photo = photos[index] ?? photos[0];
  function move(direction: number) { setIndex((current) => (current + direction + photos.length) % photos.length); }
  return <section className={styles.gallery} aria-label="Фотографии лота">
    <div className={styles.main} tabIndex={photos.length > 1 ? 0 : undefined} onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
      {photo ? <AssetImage src={photo.name} alt={`${lot.title}, фото ${index + 1}`} width={754} height={328} className={styles.photo} eager /> : <p>Фотографий пока нет</p>}
      {photos.length > 1 && <><button type="button" className={styles.previous} aria-label="Предыдущее фото" onClick={() => move(-1)}><Icon name="chevron" /></button><button type="button" className={styles.next} aria-label="Следующее фото" onClick={() => move(1)}><Icon name="chevron" /></button><span className={styles.counter} aria-live="polite">{index + 1} / {photos.length}</span></>}
    </div>
    {photos.length > 1 && <div className={styles.thumbnails}>{photos.map((item, itemIndex) => <button type="button" key={`${item.order}:${item.name}`} aria-label={`Показать фото ${itemIndex + 1}`} aria-pressed={index === itemIndex} onClick={() => setIndex(itemIndex)}><AssetImage src={item.name} alt="" width={236} height={110} className={styles.thumbnail} /></button>)}</div>}
  </section>;
}
