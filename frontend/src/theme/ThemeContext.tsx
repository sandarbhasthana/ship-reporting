/**
 * Ship Reporting App - Theme Context
 * Provides theme state management with light/dark mode toggle and accent colors
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
import { lightTheme, darkTheme, getAccentPreset } from "./tokens";
import type { ThemeMode, ThemeContextType } from "./types";
import { ThemeContext } from "./context";

const THEME_STORAGE_KEY = "ship-reporting-theme";
const ACCENT_STORAGE_KEY = "ship-reporting-accent";

/**
 * Get initial theme from localStorage or system preference
 */
function getInitialTheme(): ThemeMode {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }
  return "light";
}

/**
 * Get initial accent color from localStorage
 */
function getInitialAccent(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (stored) return stored;
  }
  return "purple";
}

/**
 * Apply accent color CSS variables to document root
 */
function applyAccentColors(accentId: string, isDark: boolean) {
  const preset = getAccentPreset(accentId);
  const root = document.documentElement;

  root.style.setProperty("--color-primary", preset.primary);
  root.style.setProperty("--color-primary-hover", preset.hover);
  root.style.setProperty("--color-primary-active", preset.active);
  root.style.setProperty("--color-primary-dark", preset.dark);

  // Apply different light color for dark mode
  if (isDark) {
    root.style.setProperty("--color-primary-light", preset.lightModeBg);
  } else {
    root.style.setProperty("--color-primary-light", preset.light);
  }
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(getInitialTheme);
  const [accentColor, setAccentColorState] = useState<string>(getInitialAccent);

  // Update document attribute and localStorage when theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    // Re-apply accent colors when mode changes (light/dark have different light colors)
    applyAccentColors(accentColor, mode === "dark");
  }, [mode, accentColor]);

  // Apply accent colors on initial load and when accent changes
  useEffect(() => {
    localStorage.setItem(ACCENT_STORAGE_KEY, accentColor);
    applyAccentColors(accentColor, mode === "dark");
  }, [accentColor, mode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
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

  const setAccentColor = useCallback((colorId: string) => {
    setAccentColorState(colorId);
  }, []);

  const themeConfig = useMemo<ThemeConfig>(() => {
    const baseTheme = mode === "dark" ? darkTheme : lightTheme;
    const preset = getAccentPreset(accentColor);

    // Generate rgba colors for menu backgrounds
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          }
        : { r: 160, g: 90, b: 255 };
    };
    const rgb = hexToRgb(preset.primary);
    const menuSelectedBg =
      mode === "dark"
        ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`
        : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
    const menuHoverBg =
      mode === "dark"
        ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`
        : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`;

    return {
      ...baseTheme,
      token: {
        ...baseTheme.token,
        colorPrimary: preset.primary,
        colorLink: preset.primary,
        colorLinkHover: preset.hover,
        colorLinkActive: preset.active
      },
      components: {
        ...baseTheme.components,
        Button: {
          ...baseTheme.components?.Button,
          colorPrimaryHover: preset.hover,
          colorPrimaryActive: preset.active
        },
        Menu: {
          ...baseTheme.components?.Menu,
          itemSelectedBg: menuSelectedBg,
          itemSelectedColor: mode === "dark" ? preset.hover : preset.primary,
          itemHoverBg: menuHoverBg
        }
      },
      algorithm:
        mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
    };
  }, [mode, accentColor]);

  const value = useMemo<ThemeContextType>(
    () => ({
      mode,
      toggleTheme,
      setTheme,
      themeConfig,
      isDark: mode === "dark",
      accentColor,
      setAccentColor
    }),
    [mode, toggleTheme, setTheme, themeConfig, accentColor, setAccentColor]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
