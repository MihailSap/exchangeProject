export type AuthMode = "login" | "register" | "forgot" | "reset";
export type FieldName = "name" | "email" | "password" | "repeatPassword";
export type FormValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;

export const INITIAL_VALUES: FormValues = { name: "", email: "", password: "", repeatPassword: "" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validate(values: FormValues, mode: AuthMode): FieldErrors {
  const errors: FieldErrors = {};
  const usesEmail = mode === "login" || mode === "register" || mode === "forgot";
  const usesPassword = mode === "login" || mode === "register" || mode === "reset";

  if (mode === "register" && values.name.length > 80) errors.name = "Имя должно содержать не более 80 символов";
  else if (mode === "register" && !values.name.trim()) errors.name = "Поле обязательно";
  else if (mode === "register" && values.name.trim().length < 2) errors.name = "Имя должно содержать не менее 2 символов";

  if (usesEmail && values.email.length > 254) errors.email = "Email должен содержать не более 254 символов";
  else if (usesEmail && !values.email.trim()) errors.email = "Поле обязательно";
  else if (usesEmail && !EMAIL_PATTERN.test(values.email.trim())) errors.email = "Введите email в формате name@example.com";

  if (usesPassword && values.password.length > 128) errors.password = "Пароль должен содержать не более 128 символов";
  else if (usesPassword && !values.password) errors.password = "Поле обязательно";
  else if (usesPassword && values.password.length < 8) errors.password = "Пароль должен содержать не менее 8 символов";

  if ((mode === "register" || mode === "reset") && !values.repeatPassword) errors.repeatPassword = "Поле обязательно";
  else if ((mode === "register" || mode === "reset") && values.repeatPassword !== values.password) {
    errors.repeatPassword = "Пароли не совпадают";
  }

  return errors;
}

