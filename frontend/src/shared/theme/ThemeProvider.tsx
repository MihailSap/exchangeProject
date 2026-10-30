"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";
type ThemeContextValue = { theme: Theme; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = "exchange.theme";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let savedTheme: string | null = null;
    try {
      savedTheme = window.localStorage.getItem(THEME_KEY);
    } catch {
      savedTheme = null;
    }
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.dataset.theme = savedTheme;
      setTheme(savedTheme);
    } else {
      document.documentElement.removeAttribute("data-theme");
      setTheme(systemTheme());
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      if (!document.documentElement.dataset.theme) setTheme(systemTheme());
    };
    media.addEventListener("change", syncSystemTheme);
    return () => {
      media.removeEventListener("change", syncSystemTheme);
      if (transitionTimer.current !== null) clearTimeout(transitionTimer.current);
      document.documentElement.removeAttribute("data-theme-changing");
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.dataset.themeChanging = "true";
    root.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      root.dataset.theme = nextTheme;
    }
    setTheme(nextTheme);
    if (transitionTimer.current !== null) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      root.removeAttribute("data-theme-changing");
      transitionTimer.current = null;
    }, 500);
  }, [theme]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
