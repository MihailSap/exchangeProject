export const LOT_ESTIMATE = { recommended: 27500, minimum: 24000, maximum: 31000 };
export function pricePosition(price: number): number {
  const range = LOT_ESTIMATE.maximum - LOT_ESTIMATE.minimum;

  return Math.min(98, Math.max(2, 26.64 + ((price - LOT_ESTIMATE.minimum) / range) * 46.72));
}
export function priceVerdict(price: number): string {
  if (price < LOT_ESTIMATE.minimum) return "Ваша оценка ниже рынка";

  if (price > LOT_ESTIMATE.maximum) return "Ваша оценка выше рынка";

  return "Ваша оценка в рынке";
}
