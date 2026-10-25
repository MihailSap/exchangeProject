import { useId } from "react";
import type { ChangeEvent, ReactNode } from "react";
import styles from "./FormField.module.scss";

type FormFieldProps = { label: string; value: string; onChange: (value: string) => void; onBlur: () => void; maxLength: number; error?: string; required?: boolean; multiline?: boolean; children?: ReactNode; name: string; disabled?: boolean };
export function FormField({ label, value, onChange, onBlur, maxLength, error, required, multiline, children, name, disabled }: FormFieldProps) {
  const id = useId();
  const props = { id, name, value, maxLength, required, disabled, onBlur, onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(event.currentTarget.value), "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined };
  return <div className={styles.field}><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    {children ? <select {...props}>{children}</select> : multiline ? <textarea {...props} rows={4} /> : <input {...props} type="text" />}
    {error && <span id={`${id}-error`} className={styles.error} role="alert">{error}</span>}
  </div>;
}
