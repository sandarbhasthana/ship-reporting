/**
 * Ship Reporting App - Theme Hook
 * Hook to access theme context
 */

import { useContext } from "react";
import { ThemeContext } from "./context";
import type { ThemeContextType } from "./types";

/**
 * Hook to access theme context
 * @throws {Error} If used outside of ThemeProvider
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
