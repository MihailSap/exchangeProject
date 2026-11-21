"use client";

import { useEffect, useState } from "react";

import styles from "./LotForm.module.scss";

import type { LotPhotoSelection } from "../model/photos";

import { AssetImage } from "@/src/shared/ui/asset-image";

export function LotPhotoReview({ photos }: { photos: LotPhotoSelection[] }) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  useEffect(() => {
    const urls: Record<string, string> = {};
    photos.forEach((photo) => {
      if (photo.kind === "file") urls[photo.key] = URL.createObjectURL(photo.file);
    });
    setPreviews(urls);

    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  return (
    <div className={styles.reviewPhotos}>
      <span>Фотографии</span>
      <ul>{photos.map((photo, index) => {
        const src = photo.kind === "existing" ? photo.photo.name : previews[photo.key];

        return <li key={photo.key}>{src && <AssetImage src={src} alt={`Фото ${index + 1}${index === 0 ? " — обложка" : ""}`} width={80} height={80} />}</li>;
      })}
      </ul>
    </div>
  );
}
