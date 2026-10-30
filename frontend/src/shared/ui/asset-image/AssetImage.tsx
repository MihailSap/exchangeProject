"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { getProtectedImage } from "@/src/shared/api/files";
import { getLocalImage, isLocalImage } from "@/src/shared/lib/local-images";

export function AssetImage({
  src,
  alt,
  width,
  height,
  className,
  eager = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  eager?: boolean;
}) {
  const direct = src.startsWith("/") || src.startsWith("blob:") || src.startsWith("https://");
  const [loaded, setLoaded] = useState<{ name: string; url: string } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    if (direct) return;

    let active = true;
    let url = "";
    (isLocalImage(src) ? getLocalImage(src) : getProtectedImage(src))
      .then((blob) => {
        if (active) {
          url = URL.createObjectURL(blob);
          setLoaded({ name: src, url });
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [direct, src]);
  const url = direct ? src : loaded?.name === src ? loaded.url : null;

  return url && !failed ? (
    <Image
      src={url}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
    />
  ) : (
    <span className={className} role="img" aria-label={alt}>
      {failed ? "Фото недоступно" : "Загружаем фото…"}
    </span>
  );
}
