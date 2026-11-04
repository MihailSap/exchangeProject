export const KEYWORD_LIMIT = 300;
export const KEYWORD_COUNT = 10;

export function keywordError(value: string, tags: string[]): string | undefined {
  const keyword = value.trim();
  if (!keyword) return undefined;

  if (keyword.length < 2) return "Пожелание должно содержать не меньше 2 символов";

  if (tags.some((tag) => tag.toLocaleLowerCase("ru-RU") === keyword.toLocaleLowerCase("ru-RU")))
    return "Это пожелание уже добавлено";

  if (tags.length >= KEYWORD_COUNT) return "Можно добавить не больше 10 пожеланий";

  if (tags.join("").length + value.length > KEYWORD_LIMIT)
    return "Пожелания должны содержать не больше 300 символов суммарно";

  return undefined;
}
