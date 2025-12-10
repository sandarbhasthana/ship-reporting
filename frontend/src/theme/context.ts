/**
 * Ship Reporting App - Theme Context Definition
 * React context for theme state
 */

import { createContext } from "react";
import type { ThemeContextType } from "./types";

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

