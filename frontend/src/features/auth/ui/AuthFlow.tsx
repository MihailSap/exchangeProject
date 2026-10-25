"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, InputHTMLAttributes, ReactNode } from "react";
import { useSession } from "@/src/entities/session";
import { ApiError } from "@/src/shared/api/client";
import { useToast } from "@/src/shared/ui/toast/ToastProvider";
import { registerAndSignIn, requestPasswordReset, resetPassword, signIn } from "../model/auth-api";
import { INITIAL_VALUES, validate } from "../model/auth-validation";
import type { AuthMode, FieldName, FormValues } from "../model/auth-validation";
import styles from "./AuthFlow.module.scss";

const COPY: Record<AuthMode, { title: string; description: string; submit: string }> = {
  login: {
    title: "Рады видеть вас снова",
    description: "Войдите, чтобы продолжить обмены, посмотреть предложения и сообщения.",
    submit: "Войти",
  },
  register: {
    title: "Давайте меняться",
    description: "Создайте аккаунт, чтобы предлагать вещи и услуги и находить подходящие обмены.",
    submit: "Создать аккаунт",
  },
  forgot: {
    title: "Забыли пароль?",
    description: "Укажите email, и мы отправим ссылку для сброса пароля.",
    submit: "Отправить ссылку",
  },
  reset: {
    title: "Новый пароль",
    description: "Придумайте новый пароль и подтвердите его.",
    submit: "Сбросить пароль",
  },
};

type FieldProps = {
  name: FieldName;
  label: string;
  value: string;
  error?: string;
  type: InputHTMLAttributes<HTMLInputElement>["type"];
  placeholder: string;
  maxLength: number;
  autoComplete: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  revealable?: boolean;
};

function FormField({ name, label, value, error, type, placeholder, maxLength, autoComplete, onChange, onBlur, revealable }: FieldProps) {
  const [revealed, setRevealed] = useState(false);
  const inputType = revealable && revealed ? "text" : type;
  const errorId = `${name}-error`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={name}>{label}</label>
      <div className={`${styles.inputWrap} ${error ? styles.invalid : ""}`}>
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          required
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.currentTarget.value)}
          onBlur={onBlur}
        />
        {revealable && (
          <button
            className={styles.revealButton}
            type="button"
            aria-label={revealed ? "Скрыть пароль" : "Показать пароль"}
            aria-pressed={revealed}
            onClick={() => setRevealed((current) => !current)}
          >
            <Image src="/images/auth/eye.svg" alt="" width={20} height={20} />
          </button>
        )}
      </div>
      {error && <span className={styles.fieldError} id={errorId} role="alert">{error}</span>}
    </div>
  );
}

function AuthArtwork() {
  return (
    <aside className={styles.artwork} aria-label="Сообщество обмена">
      <span className={styles.artworkTag}>СООБЩЕСТВО ОБМЕНА</span>
      <div className={styles.artworkCopy}>
        <h2>У вещей есть<br />вторая жизнь.</h2>
        <p>Находите то, что давно искали — и отдавайте то, чем готовы поделиться.</p>
      </div>
      <Image
        className={styles.artworkImage}
        src="/images/auth/community-still-life.png"
        alt="Книги, чашка, растение и камера на светлом фоне"
        width={300}
        height={300}
        priority
      />
    </aside>
  );
}

function FooterLinks({ children }: { children: ReactNode }) {
  return <div className={styles.formFooter}>{children}</div>;
}

export function AuthFlow({ mode, token }: { mode: AuthMode; token?: string }) {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [validationVisible, setValidationVisible] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const validationTimers = useRef<Partial<Record<FieldName, ReturnType<typeof setTimeout>>>>({});
  const router = useRouter();
  const { setUser } = useSession();
  const { notify } = useToast();
  const copy = COPY[mode];
  const allErrors = useMemo(() => validate(values, mode), [values, mode]);
  const hasErrors = Object.keys(allErrors).length > 0;

  useEffect(() => () => {
    Object.values(validationTimers.current).forEach((timer) => {
      if (timer) clearTimeout(timer);
    });
  }, []);

  function updateField(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (touched[name]) {
      setValidationVisible((current) => ({ ...current, [name]: false }));
      const currentTimer = validationTimers.current[name];
      if (currentTimer) clearTimeout(currentTimer);
      validationTimers.current[name] = setTimeout(() => {
        setValidationVisible((current) => ({ ...current, [name]: true }));
        delete validationTimers.current[name];
      }, 400);
    }
  }

  function touch(name: FieldName) {
    setTouched((current) => ({ ...current, [name]: true }));
    setValidationVisible((current) => ({ ...current, [name]: true }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ name: true, email: true, password: true, repeatPassword: true });
    setValidationVisible({ name: true, email: true, password: true, repeatPassword: true });
    if (hasErrors) {
      const firstInvalidField = Object.keys(allErrors)[0];
      if (firstInvalidField) document.getElementById(firstInvalidField)?.focus();
      return;
    }
    if ((mode === "reset" && !token) || submitting) return;

    setSubmitting(true);
    try {
      if (mode === "login") {
        const session = await signIn(values.email.trim(), values.password);
        setUser(session.user);
        notify({ kind: "success", title: "Вы вошли в аккаунт" });
        router.replace("/");
      } else if (mode === "register") {
        const session = await registerAndSignIn(values.name.trim(), values.email.trim(), values.password);
        setUser(session.user);
        notify({
          kind: "success",
          title: "Аккаунт создан",
          description: "Подтвердите email",
          duration: 7000,
        });
        router.replace("/");
      } else if (mode === "forgot") {
        await requestPasswordReset(values.email.trim());
        notify({ kind: "success", title: "Ссылка для сброса пароля отправлена на почту" });
        router.replace("/login");
      } else {
        if (!token) throw new Error("Ссылка для сброса пароля недействительна или устарела.");
        await resetPassword(token, values.password);
        notify({ kind: "success", title: "Пароль успешно сброшен" });
        router.replace("/login");
      }
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error
        ? error.message
        : "Не удалось выполнить запрос. Попробуйте позже.";
      notify({ kind: "error", title: message || "Не удалось выполнить запрос. Попробуйте позже." });
    } finally {
      setSubmitting(false);
    }
  }

  const fields = mode === "register"
    ? [
        { name: "name" as const, label: "Имя", type: "text" as const, placeholder: "Как вас зовут", maxLength: 80, autoComplete: "name" },
        { name: "email" as const, label: "Email", type: "email" as const, placeholder: "you@example.com", maxLength: 254, autoComplete: "email" },
        { name: "password" as const, label: "Пароль", type: "password" as const, placeholder: "Придумайте пароль", maxLength: 128, autoComplete: "new-password", revealable: true },
        { name: "repeatPassword" as const, label: "Повторите пароль", type: "password" as const, placeholder: "Повторите пароль", maxLength: 128, autoComplete: "new-password", revealable: true },
      ]
    : mode === "reset"
      ? [
          { name: "password" as const, label: "Пароль", type: "password" as const, placeholder: "Придумайте пароль", maxLength: 128, autoComplete: "new-password", revealable: true },
          { name: "repeatPassword" as const, label: "Повторите пароль", type: "password" as const, placeholder: "Повторите пароль", maxLength: 128, autoComplete: "new-password", revealable: true },
        ]
      : [{ name: "email" as const, label: "Email", type: "email" as const, placeholder: "you@example.com", maxLength: 254, autoComplete: "email" },
          ...(mode === "login" ? [{ name: "password" as const, label: "Пароль", type: "password" as const, placeholder: "Введите пароль", maxLength: 128, autoComplete: "current-password", revealable: true }] : [])];

  const showBack = true;

  return (
    <>
      <main className={`${styles.main} ${styles[mode] ?? ""}`}>
        <div className={styles.container}>
          {showBack && (
            <Link className={styles.backLink} href="/">
              <Image src="/images/auth/arrow-left.svg" alt="" width={15} height={15} />
              На главную
            </Link>
          )}
          <div className={styles.layout}>
            <AuthArtwork />
            <section className={styles.card} aria-labelledby="auth-title">
              <div className={styles.heading}>
                <h1 id="auth-title">{copy.title}</h1>
                <p>{copy.description}</p>
              </div>
              {mode === "reset" && !token && (
                <p className={styles.notice} role="alert">Ссылка для сброса пароля недействительна или устарела.</p>
              )}
              <form className={styles.form} noValidate onSubmit={handleSubmit}>
                <div className={styles.fields}>
                  {fields.map((field) => (
                    <FormField
                      key={field.name}
                      {...field}
                      value={values[field.name]}
                      error={touched[field.name] && validationVisible[field.name] ? allErrors[field.name] : undefined}
                      onChange={(value) => updateField(field.name, value)}
                      onBlur={() => touch(field.name)}
                    />
                  ))}
                </div>
                {mode === "login" && (
                  <Link className={styles.forgotLink} href="/forgot-password">Забыли пароль?</Link>
                )}
                <button className={styles.submit} type="submit" disabled={hasErrors || submitting || (mode === "reset" && !token)}>
                  {submitting ? "Подождите…" : copy.submit}
                </button>
              </form>
              {(mode === "login" || mode === "register") && (
                <FooterLinks>
                  {mode === "login" ? (
                    <><span>Ещё нет аккаунта?</span><Link href="/register">Зарегистрироваться</Link></>
                  ) : (
                    <><span>Уже есть аккаунт?</span><Link href="/login">Войти</Link></>
                  )}
                </FooterLinks>
              )}
              {mode === "forgot" && (
                <FooterLinks><span>Вспомнили пароль?</span><Link href="/login">Войти</Link></FooterLinks>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
