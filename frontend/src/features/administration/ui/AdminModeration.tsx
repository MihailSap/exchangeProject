"use client";

import { useEffect, useState } from "react";

import styles from "./Administration.module.scss";
import { ModerationDialog } from "./ModerationDialog";
import { getModerationLots } from "../api/admin-api";

import type { ModerationPage } from "../model/contracts";
import type { Lot } from "@/src/entities/lot";

import { ApiError } from "@/src/shared/api/client";
import { AssetImage } from "@/src/shared/ui/asset-image";
import { Loading } from "@/src/shared/ui/loading";

type Props = { active: boolean; onDenied: (error: unknown) => boolean };

export function AdminModeration({ active, onDenied }: Props) {
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<ModerationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Lot | null>(null);

  useEffect(() => {
    if (!active) return;

    let current = true;
    setLoading(true);
    setError("");
    void getModerationLots(page).then((data) => {
      if (!current) return;

      if (data.page !== page) throw new ApiError("Сервер вернул другую страницу лотов", 502);

      if (page > 0 && data.totalPages <= page) {
        setPage(Math.max(0, data.totalPages - 1));

        return;
      }

      setResult(data);
    }).catch((error: unknown) => {
      if (!current || onDenied(error)) return;

      setResult(null);
      setError(error instanceof Error ? error.message : "Не удалось загрузить очередь модерации");
    }).finally(() => {
      if (current) setLoading(false);
    });

    return () => {
      current = false;
    };
  }, [page, attempt, active, onDenied]);

  return (
    <section className={styles.panel} aria-labelledby="admin-moderation-title">
      <div className={styles.heading}>
        <div>
          <h2 id="admin-moderation-title">Лоты на модерации</h2>
          <p>Проверьте фотографии, описание и условия обмена</p>
        </div>
        {!loading && result && <span className={styles.counter}>{result.totalElements}</span>}
      </div>
      {loading ? <Loading label="Загружаем лоты…" /> : error ? (
        <div className={styles.state} role="status">
          <p>{error}</p>
          <button type="button" className={styles.secondary} onClick={() => setAttempt((value) => value + 1)}>Повторить загрузку</button>
        </div>
      ) : result && (result.content.length === 0 ? <p className={styles.state}>Нет лотов на модерации</p> : (
        <>
          <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Таблица лотов на модерации">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Лот</th>
                  <th scope="col">Владелец</th>
                  <th scope="col">Категория и регион</th>
                  <th scope="col">Стоимость</th>
                  <th scope="col">Действия</th>
                </tr>
              </thead>
              <tbody>{result.content.map((lot) => (
                <tr key={lot.id}>
                  <td>
                    <div className={styles.identity}>
                      {lot.photos[0] && <AssetImage className={styles.lotThumb} src={lot.photos[0].name} alt="" width={56} height={56} />}
                      <div>
                        <strong>{lot.title}</strong>
                        <small>№ {lot.id} · {lot.type === "PRODUCT" ? "Товар" : "Услуга"}</small>
                      </div>
                    </div>
                  </td>
                  <td>{lot.owner.name}</td>
                  <td>
                    {lot.category.name}
                    <br />
                    {lot.region}
                  </td>
                  <td className={styles.noWrap}>{lot.estimated_cost.toLocaleString("ru-RU")} ₽</td>
                  <td>
                    <button type="button" className={styles.primary} onClick={() => setSelected(lot)}>Проверить</button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
          {result.totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Страницы очереди модерации">
              <button type="button" className={styles.secondary} disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Назад</button>
              <span>{page + 1} из {result.totalPages}</span>
              <button type="button" className={styles.secondary} disabled={page + 1 >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Далее</button>
            </nav>
          )}
        </>
      ))}
      {selected && <ModerationDialog
        lot={selected}
        onClose={() => setSelected(null)}
        onDenied={onDenied}
        onSaved={() => {
          setSelected(null);
          setAttempt((value) => value + 1);
        }}
      />}
    </section>
  );
}
