/**
 * Theme Toggle Component
 * A button to switch between light and dark themes
 */

import { Button, Tooltip } from "antd";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useTheme } from "../theme";

interface ThemeToggleProps {
  /** Whether to show the toggle as just an icon or with text */
  showText?: boolean;
}

export function ThemeToggle({ showText = false }: ThemeToggleProps) {
  const { mode, toggleTheme } = useTheme();
  const isDark = mode === "dark";

  const button = (
    <Button
      type="text"
      icon={isDark ? <SunOutlined /> : <MoonOutlined />}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {showText && (isDark ? "Light Mode" : "Dark Mode")}
    </Button>
  );

  if (showText) {
    return button;
  }

  return (
    <Tooltip title={isDark ? "Switch to light theme" : "Switch to dark theme"}>
      {button}
    </Tooltip>
  );
}

