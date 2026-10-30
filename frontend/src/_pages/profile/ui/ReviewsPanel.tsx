import styles from "./ReviewsPanel.module.scss";
import { formatDate, latestReviews, ratingOf } from "../model/demo-data";

import type { Review } from "../model/demo-data";

import { Avatar } from "@/src/shared/ui/avatar";
import { Stars } from "@/src/shared/ui/stars";

export function ReviewsPanel({ reviews }: { reviews: Review[] }) {
  const rating = ratingOf(reviews);

  return (
    <section aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className={styles.title}>
        Отзывы и рейтинг
      </h2>
      <div className={styles.summary}>
        <div>
          {rating !== null && (
            <strong>
              {rating.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}
              <small> / 5</small>
            </strong>
          )}
          <Stars value={rating} />
          <p>
            {reviews.length
              ? `Отзывов: ${reviews.length} · средняя оценка всех обменов`
              : "Здесь появятся отзывы после завершённых обменов"}
          </p>
        </div>
        {rating !== null && (
          <div className={styles.distribution}>
            {[5, 4, 3, 2, 1].map((score) => (
              <div key={score}>
                <span>{score} ★</span>
                <progress
                  max={reviews.length}
                  value={reviews.filter((review) => review.score === score).length}
                  aria-label={`Отзывы с оценкой ${score}`}
                />
                <span>{reviews.filter((review) => review.score === score).length}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.list}>
        {latestReviews(reviews).map((review) => (
          <article key={review.id} id={`review-${review.id}`} className={styles.review}>
            <div className={styles.author}>
              <Avatar name={review.authorName} small />
              <div>
                <h3>{review.authorName}</h3>
                <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
              </div>
              <Stars value={review.score} />
            </div>
            <p>{review.text}</p>
            <span className={styles.lot}>Обмен: {review.lotTitle}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
