"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import styles from "./Avatar.module.scss";

import { getCachedProtectedImageUrl, getProtectedImageUrl } from "@/src/shared/api/files";
import { readTokens } from "@/src/shared/lib/session-storage";

type AvatarProps = { name: string; src?: string | null; small?: boolean };

export function Avatar({ name, src, small = false }: AvatarProps) {
  const [image, setImage] = useState<{ key: string; url: string } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const imageKey = `${readTokens()?.refreshToken ?? ""}:${src ?? ""}`;
  useEffect(() => {
    if (!src || src.startsWith("/") || src.startsWith("blob:") || src.startsWith("https://"))
      return;

    let active = true;
    getProtectedImageUrl(src)
      .then((url) => {
        if (!active) return;

        setImage({ key: imageKey, url });
      })
      .catch(() => {
        if (active) setFailed(imageKey);
      });

    return () => {
      active = false;
    };
  }, [src, imageKey]);
  const size = small ? 34 : 54;
  const direct =
    src && (src.startsWith("/") || src.startsWith("blob:") || src.startsWith("https://"))
      ? src
      : null;

  const resolved =
    failed !== imageKey
      ? direct ||
        (src ? getCachedProtectedImageUrl(src) : null) ||
        (image?.key === imageKey ? image.url : null)
      : null;

  return (
    <span className={`${styles.avatar} ${small ? styles.small : ""}`}>
      {resolved ? (
        <Image
          src={resolved}
          alt={`Аватар: ${name}`}
          width={size}
          height={size}
          unoptimized
          loading="eager"
          className={styles.photo}
          onError={() => setFailed(imageKey)}
        />
      ) : (
        <>
          <Image
            src={`/images/profile/${small ? "avatar-small" : "avatar"}.svg`}
            alt=""
            width={size}
            height={size}
          />
          <span className={styles.initial} aria-label={name}>
            {name.trim().charAt(0).toLocaleUpperCase("ru-RU") || "?"}
          </span>
        </>
      )}
    </span>
  );
}
