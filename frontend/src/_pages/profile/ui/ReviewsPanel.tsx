"use client";

import { useState } from "react";

import styles from "./ReviewsPanel.module.scss";
import { formatDate, latestReviews, ratingOf } from "../model/demo-data";

import type { Review } from "../model/demo-data";
import type { KeyboardEvent } from "react";

import { Avatar } from "@/src/shared/ui/avatar";
import { Stars } from "@/src/shared/ui/stars";

type ReviewTab = "received" | "sent";

type Props = { reviews: Review[]; sentReviews: Review[] };

export function ReviewsPanel({ reviews, sentReviews }: Props) {
  const [tab, setTab] = useState<ReviewTab>("received");
  const rating = ratingOf(reviews);
  const visible = latestReviews(tab === "received" ? reviews : sentReviews);
  const tabs = [
    { id: "received", label: "Полученные", count: reviews.length },
    { id: "sent", label: "Оставленные", count: sentReviews.length },
  ] as const;

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    const next = event.key === "Home" ? "received" : event.key === "End" ? "sent" : tab === "received" ? "sent" : "received";
    setTab(next);
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`#reviews-tab-${next}`)?.focus();
  }

  return (
    <section aria-labelledby="reviews-heading" className={styles.panel}>
      <h2 id="reviews-heading" className={styles.title}>Отзывы и рейтинг</h2>
      <div className={styles.summary}>
        <div className={styles.average}>
          <strong>{rating?.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? "—"}</strong>
          <Stars value={rating} />
          <p>{reviews.length ? `На основе ${reviews.length} ${reviews.length % 10 === 1 && reviews.length % 100 !== 11 ? "отзыва" : "отзывов"}` : "После завершённых обменов"}</p>
        </div>
        <div className={styles.distribution} aria-label="Распределение полученных оценок">
          {[5, 4, 3, 2, 1].map((score) => {
            const count = reviews.filter((review) => review.score === score).length;

            return (
              <div key={score}>
                <span>
                  {score}
                  {" "}
                  <span className={styles.scoreStar} aria-hidden="true">★</span>
                </span>
                <progress max={reviews.length || 1} value={count} aria-label={`Оценка ${score}: ${count} из ${reviews.length}`} />
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.tabs} role="tablist" aria-label="Отзывы участника">
        {tabs.map((item) => (
          <button key={item.id} type="button" role="tab" id={`reviews-tab-${item.id}`} aria-selected={tab === item.id} aria-controls="reviews-panel" tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={onTabKeyDown}>
            {item.label}
            {" "}
            <span>{item.count}</span>
          </button>
        ))}
      </div>
      <div key={tab} className={styles.list} role="tabpanel" id="reviews-panel" aria-labelledby={`reviews-tab-${tab}`} tabIndex={0}>
        {visible.length ? visible.map((review) => (
          <article key={review.id} id={`review-${review.id}`} className={styles.review}>
            <div className={styles.author}>
              <Avatar name={review.authorName} small />
              <div className={styles.authorDetails}>
                <h3>{review.authorName}</h3>
                <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
              </div>
              <span className={styles.reviewStars}>
                <Stars value={review.score} />
              </span>
            </div>
            {review.recipientName && <span className={styles.recipient}>Получатель: {review.recipientName}</span>}
            <p>{review.text}</p>
            <span className={styles.lot}>Лот: {review.lotTitle}</span>
          </article>
        )) : <p className={styles.empty}>{tab === "received" ? "Пока нет полученных отзывов. Они появятся после завершённых обменов." : "Пока нет оставленных отзывов."}</p>}
      </div>
    </section>
  );
}
