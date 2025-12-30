/**
 * Ship Reporting App - Theme Types
 * Shared type definitions for theme system
 */

import type { ThemeConfig } from "antd";

export type ThemeMode = "light" | "dark";

export interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  themeConfig: ThemeConfig;
  isDark: boolean;
  accentColor: string;
  setAccentColor: (colorId: string) => void;
}
