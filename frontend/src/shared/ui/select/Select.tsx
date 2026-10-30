"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import styles from "./Select.module.scss";

import type { KeyboardEvent } from "react";

import { Icon } from "@/src/shared/ui/icon";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type Props = {
  id?: string;
  name?: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  labelledBy?: string;
  ariaLabel?: string;
  placeholder?: string;
  variant?: "form" | "filter" | "sort";
};

export function Select({
  id,
  name,
  value,
  options,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  invalid = false,
  describedBy,
  labelledBy,
  ariaLabel,
  placeholder = "Выберите значение",
  variant = "form",
}: Props) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const listId = `${controlId}-options`;
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 320 });
  const typed = useRef({ text: "", at: 0 });
  const selected = options.find((option) => option.value === value);

  function available(): boolean {
    return !disabled && !trigger.current?.matches(":disabled");
  }

  function expand(index?: number): void {
    if (!available()) return;

    const selectedIndex = options.findIndex((option) => option.value === value && !option.disabled);
    setActive(
      index ??
        (selectedIndex >= 0 ? selectedIndex : options.findIndex((option) => !option.disabled)),
    );
    setOpen(true);
  }

  function choose(index: number): void {
    const option = options[index];
    if (!option || option.disabled || !available()) return;

    onChange(option.value);
    setOpen(false);
    trigger.current?.focus();
  }

  useLayoutEffect(() => {
    if (!open || disabled) return;

    const panel = list.current;
    const button = trigger.current;
    if (!panel || !button) return;

    const update = () => {
      const box = button.getBoundingClientRect();
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offset = viewport?.offsetTop ?? 0;
      if (box.bottom < offset || box.top > height + offset) {
        setOpen(false);

        return;
      }

      const below = height + offset - box.bottom - 12;
      const above = box.top - offset - 12;
      const upwards = below < 200 && above > below;
      const maxHeight = Math.max(44, Math.min(320, upwards ? above : below));
      const width = Math.min(box.width, window.innerWidth - 16);
      panel.style.width = `${width}px`;
      panel.style.maxHeight = `${maxHeight}px`;
      const actualHeight = panel.getBoundingClientRect().height;
      setPosition({
        top: upwards ? box.top - actualHeight - 6 : box.bottom + 6,
        left: Math.max(8, Math.min(box.left, window.innerWidth - box.width - 8)),
        width,
        maxHeight,
      });
    };

    panel.showPopover();
    update();
    const observer = new ResizeObserver(update);
    observer.observe(button);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);

    return () => {
      if (panel.matches(":popover-open")) panel.hidePopover();

      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [open, disabled, options.length]);
  useEffect(() => {
    if (!open) return;

    function outside(event: PointerEvent): void {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener("pointerdown", outside);

    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    if (open)
      list.current
        ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function move(direction: number): void {
    let index = active;
    for (let step = 0; step < options.length; step++) {
      index = (index + direction + options.length) % options.length;
      if (!options[index]?.disabled) {
        setActive(index);

        return;
      }
    }
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (!available()) return;

    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);

      return;
    }

    if (event.key === "Tab") {
      setOpen(false);

      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) expand();
      else move(event.key === "ArrowDown" ? 1 : -1);

      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const index =
        event.key === "Home"
          ? options.findIndex((option) => !option.disabled)
          : options.findLastIndex((option) => !option.disabled);

      if (!open) expand(index);
      else setActive(index);

      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(active);
      else expand();

      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const letter = event.key.toLocaleLowerCase("ru-RU");
      const text = now - typed.current.at < 700 ? typed.current.text + letter : letter;
      typed.current = { text, at: now };
      const search = [...text].every((character) => character === letter) ? letter : text;
      const start = open ? active : options.findIndex((option) => option.value === value);
      for (let step = 1; step <= options.length; step++) {
        const index = (start + step + options.length) % options.length;
        const option = options[index];
        if (
          option &&
          !option.disabled &&
          option.label.trim().toLocaleLowerCase("ru-RU").startsWith(search)
        ) {
          if (!open) expand(index);
          else setActive(index);

          break;
        }
      }
    }
  }

  return (
    <div
      ref={root}
      className={`${styles.root} ${styles[variant]}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          onBlur?.();
        }
      }}
    >
      {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
      <button
        ref={trigger}
        id={controlId}
        type="button"
        role="combobox"
        className={styles.trigger}
        disabled={disabled}
        aria-expanded={open && !disabled}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-required={required}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        onKeyDown={keyDown}
        onClick={() => {
          if (open) setOpen(false);
          else expand();
        }}
      >
        <span className={`${styles.value} ${!value ? styles.placeholder : ""}`}>
          {selected?.label ?? placeholder}
        </span>
        <span className={styles.arrow} aria-hidden="true">
          <Icon name="down" />
        </span>
      </button>
      <div
        ref={list}
        popover="manual"
        id={listId}
        role="listbox"
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        className={styles.list}
        style={position}
        onPointerDown={(event) => event.preventDefault()}
      >
        {options.map((option, index) => (
          <div
            key={option.value}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={option.value === value}
            aria-disabled={option.disabled || undefined}
            data-index={index}
            data-active={active === index}
            className={styles.option}
            onPointerMove={() => {
              if (!option.disabled) setActive(index);
            }}
            onClick={() => choose(index)}
          >
            <span>{option.label}</span>
            {option.value === value && <Icon name="check" />}
          </div>
        ))}
        {!options.length && <div className={styles.empty}>Нет доступных вариантов</div>}
      </div>
    </div>
  );
}
