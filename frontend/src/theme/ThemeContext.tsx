/**
 * Ship Reporting App - Theme Context
 * Provides theme state management with light/dark mode toggle
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode
} from "react";
import { theme as antdTheme } from "antd";
import type { ThemeConfig } from "antd";
import { lightTheme, darkTheme } from "./tokens";
import type { ThemeMode, ThemeContextType } from "./types";
import { ThemeContext } from "./context";

const THEME_STORAGE_KEY = "ship-reporting-theme";

/**
 * Get initial theme from localStorage or system preference
 */
function getInitialTheme(): ThemeMode {
  // Check localStorage first
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }

    // Check system preference
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }

  return "light";
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(getInitialTheme);

  // Update document attribute and localStorage when theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setMode(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  const themeConfig = useMemo<ThemeConfig>(() => {
    const baseTheme = mode === "dark" ? darkTheme : lightTheme;

    return {
      ...baseTheme,
      algorithm:
        mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
    };
  }, [mode]);

  const value = useMemo<ThemeContextType>(
    () => ({
      mode,
      toggleTheme,
      setTheme,
      themeConfig,
      isDark: mode === "dark"
    }),
    [mode, toggleTheme, setTheme, themeConfig]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
