"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./LotPage.module.scss";

import type { Lot } from "@/src/entities/lot";
import type { UserProfile } from "@/src/entities/profile";
import type { AuthUser } from "@/src/entities/session";

import { getPublicProfile } from "@/src/entities/profile";
import { Avatar } from "@/src/shared/ui/avatar";

export function LotOwner({ lot, user, own, local }: { lot: Lot; user: AuthUser | null; own: boolean; local: boolean }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => {
    if (local || lot.source === "fixture") return;

    let active = true;
    void getPublicProfile(lot.owner.id).then((value) => {
      if (active) setProfile(value);
    }).catch(() => undefined);

    return () => {
      active = false;
    };
  }, [lot.owner.id, lot.source, own, local]);
  const details = profile?.id === lot.owner.id ? profile : own ? user : null;
  const rating = details?.rating ?? lot.owner.rating;
  const content = (
    <>
      <Avatar name={details?.name ?? lot.owner.name} src={details?.avatarUrl} />
      <div>
        <strong>{details?.name ?? lot.owner.name}</strong>
        <div className={styles.ownerMeta}>
          <span>{rating === null ? "Пока нет оценок" : `★ ${rating.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}`}</span>
          {details?.reviewsCount !== undefined && <span>{details.reviewsCount} отзывов</span>}
          {details?.createdAt && <span>На сайте с {new Date(details.createdAt).getFullYear()}</span>}
        </div>
      </div>
    </>
  );

  return (
    <div className={styles.ownerSection}>
      <h2>Владелец</h2>
      {local ? <div className={styles.owner}>{content}</div> : <Link className={styles.owner} href={own ? "/profile" : `/users/${lot.owner.id}`}>{content}</Link>}
    </div>
  );
}
