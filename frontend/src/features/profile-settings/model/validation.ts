export type ProfileValues = { name: string; region: string; contacts: string };
export type ProfileErrors = Partial<Record<keyof ProfileValues, string>>;
export const PROFILE_LIMITS = { name: 80, region: 120, contacts: 500 };
export function validateProfile(values: ProfileValues, regions: string[]): ProfileErrors {
  const errors: ProfileErrors = {};
  if (values.name.trim().length < 2 || values.name.length > PROFILE_LIMITS.name)
    errors.name = "Введите имя от 2 до 80 символов";

  if (
    !values.region ||
    values.region.length > PROFILE_LIMITS.region ||
    !regions.includes(values.region)
  )
    errors.region = "Выберите регион из списка";

  if (values.contacts.length > PROFILE_LIMITS.contacts) errors.contacts = "Не более 500 символов";

  return errors;
}
export function validateAvatar(file: { type: string; size: number } | null): string | undefined {
  if (!file) return;

  if (!["image/jpeg", "image/png"].includes(file.type)) return "Выберите изображение JPG или PNG";

  if (file.size === 0 || file.size > 10 * 1024 * 1024)
    return "Размер изображения должен быть от 1 байта до 10 МБ";
}
