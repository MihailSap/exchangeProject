import { useId } from "react";

import styles from "./FormField.module.scss";

import type { SelectOption } from "@/src/shared/ui/select";
import type { ChangeEvent } from "react";

import { Select } from "@/src/shared/ui/select";

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  maxLength: number;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  options?: readonly SelectOption[];
  name: string;
  disabled?: boolean;
};

export function FormField({
  label,
  value,
  onChange,
  onBlur,
  maxLength,
  error,
  required,
  multiline,
  options,
  name,
  disabled,
}: FormFieldProps) {
  const id = useId();
  const props = {
    id,
    name,
    value,
    maxLength,
    required,
    disabled,
    onBlur,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.currentTarget.value),
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
  };

  return (
    <div className={styles.field}>
      <label id={`${id}-label`} htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {options ? (
        <Select
          id={id}
          name={name}
          value={value}
          options={options}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
          invalid={Boolean(error)}
          describedBy={error ? `${id}-error` : undefined}
          labelledBy={`${id}-label`}
        />
      ) : multiline ? (
        <textarea {...props} rows={4} />
      ) : (
        <input {...props} type="text" />
      )}
      {error && (
        <span id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
