"use client";

import { useEffect, useId, useState } from "react";

import styles from "./LotForm.module.scss";
import { validatePhotos } from "../model/form";

import type { LotPhotoSelection } from "../model/photos";
import type { Lot } from "@/src/entities/lot";

import { AssetImage } from "@/src/shared/ui/asset-image";
import { Icon } from "@/src/shared/ui/icon";

type Props = {
  photos: LotPhotoSelection[];
  onChange: (photos: LotPhotoSelection[]) => void;
  error?: string;
  onBlur: () => void;
  disabled?: boolean;
  savedPhotosLocked?: boolean;
  onRemoveSaved: (photo: Lot["photos"][number]) => void;
  canRemoveSaved: boolean;
};

export function LotPhotosField({ photos, onChange, error, onBlur, disabled = false, savedPhotosLocked = false, onRemoveSaved, canRemoveSaved }: Props) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const id = useId();
  useEffect(() => {
    const urls: Record<string, string> = {};
    photos.forEach((photo) => {
      if (photo.kind === "file") urls[photo.key] = URL.createObjectURL(photo.file);
    });
    setPreviews(urls);

    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  return (
    <fieldset className={styles.photos} disabled={disabled}>
      <legend>Фотографии *</legend>
      <div className={styles.photoList}>
        <label className={styles.addPhoto}>
          <Icon name="plus" />
          <strong>Добавить фото</strong>
          <span>JPG, PNG до 10 МБ</span>
          <input
            type="file"
            accept="image/jpeg,image/png"
            multiple
            aria-label="Фотографии лота"
            aria-invalid={Boolean(fileError || error)}
            aria-describedby={fileError || error ? `${id}-error` : `${id}-hint`}
            onBlur={onBlur}
            onChange={(event) => {
              const added = Array.from(event.currentTarget.files ?? []);
              const message =
                photos.length + added.length > 10
                  ? "Можно добавить не больше 10 фотографий"
                  : validatePhotos(added);

              setFileError(message ?? "");
              if (!message)
                onChange([
                  ...photos,
                  ...added.map((file): LotPhotoSelection => ({
                    kind: "file",
                    key: crypto.randomUUID(),
                    file,
                  })),
                ]);

              event.currentTarget.value = "";
            }}
          />
        </label>
        {photos.map((item, index) => {
          const src = item.kind === "existing" ? item.photo.name : previews[item.key];

          return (
            <div className={styles.preview} key={item.key}>
              {src && <AssetImage src={src} alt={`Фото ${index + 1}`} width={140} height={140} />}
              <button
                type="button"
                aria-label={`Удалить фото ${index + 1}`}
                disabled={disabled || (item.kind === "existing" && !canRemoveSaved)}
                title={item.kind === "existing" && !canRemoveSaved ? "В лоте должно остаться хотя бы одно сохранённое фото" : undefined}
                onClick={() => {
                  if (item.kind === "existing") onRemoveSaved(item.photo);
                  else onChange(photos.filter((photo) => photo.key !== item.key));

                  setFileError("");
                }}
              >
                <Icon name="close" />
              </button>
              {index > 0 && !savedPhotosLocked ? (
                <button
                  type="button"
                  className={styles.cover}
                  onClick={() =>
                    onChange([item, ...photos.filter((photo) => photo.key !== item.key)])
                  }
                >
                  На обложку
                </button>
              ) : index === 0 ? (
                <span className={styles.coverLabel}>Обложка</span>
              ) : null}
            </div>
          );
        })}
      </div>
      <p id={`${id}-hint`}>{savedPhotosLocked ? "До 10 фото. Новые добавляются в конец. Первое фото служит обложкой." : "До 10 фото. Первое станет обложкой лота."}</p>
      {(fileError || error) && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {fileError || error}
        </p>
      )}
    </fieldset>
  );
}
