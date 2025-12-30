/**
 * Ship Reporting App - Ant Design Theme Tokens
 *
 * Color Palette:
 * Primary: #A05AFF (Purple), #1BCFB4 (Teal)
 * Supporting: #4BCBEB (Light Blue), #FE9496 (Coral), #9E58FF (Purple variant)
 */

import type { ThemeConfig } from "antd";

/**
 * Accent color preset definition
 */
export interface AccentColorPreset {
  id: string;
  name: string;
  primary: string;
  hover: string;
  active: string;
  light: string;
  dark: string;
  lightModeBg: string; // For dark mode adjusted light color
}

/**
 * Available accent color presets
 */
export const accentColorPresets: AccentColorPreset[] = [
  {
    id: "purple",
    name: "Purple",
    primary: "#A05AFF",
    hover: "#B574FF",
    active: "#8A4AE0",
    light: "#E8DBFF",
    dark: "#7340BF",
    lightModeBg: "#3D2866"
  },
  {
    id: "teal",
    name: "Teal",
    primary: "#1BCFB4",
    hover: "#3ED9C2",
    active: "#15B59D",
    light: "#D0F5EF",
    dark: "#129683",
    lightModeBg: "#164E44"
  },
  {
    id: "blue",
    name: "Blue",
    primary: "#4BCBEB",
    hover: "#6ED5F0",
    active: "#2FBDE3",
    light: "#D6F2FA",
    dark: "#1A8FAD",
    lightModeBg: "#1A3D47"
  },
  {
    id: "coral",
    name: "Coral",
    primary: "#FE9496",
    hover: "#FEAAAC",
    active: "#FE7E80",
    light: "#FFE5E6",
    dark: "#D4686A",
    lightModeBg: "#4D2C2D"
  },
  {
    id: "green",
    name: "Green",
    primary: "#52C41A",
    hover: "#73D13D",
    active: "#389E0D",
    light: "#D9F7BE",
    dark: "#237804",
    lightModeBg: "#1D3712"
  },
  {
    id: "orange",
    name: "Orange",
    primary: "#FA8C16",
    hover: "#FFA940",
    active: "#D46B08",
    light: "#FFE7BA",
    dark: "#AD4E00",
    lightModeBg: "#3D2607"
  },
  {
    id: "pink",
    name: "Pink",
    primary: "#EB2F96",
    hover: "#F759AB",
    active: "#C41D7F",
    light: "#FFD6E7",
    dark: "#9E1068",
    lightModeBg: "#3D1228"
  },
  {
    id: "cyan",
    name: "Cyan",
    primary: "#13C2C2",
    hover: "#36CFC9",
    active: "#08979C",
    light: "#B5F5EC",
    dark: "#006D75",
    lightModeBg: "#112D2D"
  }
];

/**
 * Get accent color preset by ID
 */
export const getAccentPreset = (id: string): AccentColorPreset => {
  return accentColorPresets.find((p) => p.id === id) || accentColorPresets[0];
};

/**
 * Brand color palette (default purple)
 */
export const brandColors = {
  primary: "#A05AFF",
  primaryHover: "#B574FF",
  primaryActive: "#8A4AE0",

  secondary: "#1BCFB4",
  secondaryHover: "#3ED9C2",
  secondaryActive: "#15B59D",

  accentBlue: "#4BCBEB",
  accentCoral: "#FE9496",
  accentPurple: "#9E58FF"
};

/**
 * Light theme configuration for Ant Design
 */
export const lightTheme: ThemeConfig = {
  token: {
    // Brand colors
    colorPrimary: brandColors.primary,
    colorSuccess: brandColors.secondary,
    colorWarning: "#FAAD14",
    colorError: "#FF4D4F",
    colorInfo: brandColors.accentBlue,

    // Link
    colorLink: brandColors.primary,
    colorLinkHover: brandColors.primaryHover,
    colorLinkActive: brandColors.primaryActive,

    // Background
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",
    colorBgLayout: "#F5F5F5",
    colorBgSpotlight: "#F5F5F5",

    // Text
    colorText: "#1F1F1F",
    colorTextSecondary: "#666666",
    colorTextTertiary: "#999999",
    colorTextQuaternary: "#BFBFBF",

    // Border
    colorBorder: "#E8E8E8",
    colorBorderSecondary: "#F0F0F0",

    // Border radius
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 4,

    // Font
    fontFamily:
      "'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,

    // Shadows
    boxShadow:
      "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
    boxShadowSecondary:
      "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)"
  },
  components: {
    Button: {
      colorPrimaryHover: brandColors.primaryHover,
      colorPrimaryActive: brandColors.primaryActive,
      borderRadius: 8
    },
    Input: {
      borderRadius: 8
    },
    Select: {
      borderRadius: 8
    },
    Card: {
      borderRadiusLG: 12
    },
    Table: {
      headerBg: "#FAFAFA",
      rowHoverBg: "#F5F5F5"
    },
    Layout: {
      headerBg: "#FFFFFF",
      siderBg: "#FFFFFF",
      bodyBg: "#F5F5F5"
    },
    Menu: {
      itemSelectedBg: "rgba(160, 90, 255, 0.1)",
      itemSelectedColor: brandColors.primary,
      itemHoverBg: "rgba(160, 90, 255, 0.05)"
    }
  }
};

/**
 * Dark theme configuration for Ant Design
 */
export const darkTheme: ThemeConfig = {
  token: {
    // Brand colors
    colorPrimary: brandColors.primary,
    colorSuccess: brandColors.secondary,
    colorWarning: "#FAAD14",
    colorError: "#FF4D4F",
    colorInfo: brandColors.accentBlue,

    // Link
    colorLink: brandColors.primaryHover,
    colorLinkHover: brandColors.primary,
    colorLinkActive: brandColors.primaryActive,

    // Background
    colorBgContainer: "#1F1F1F",
    colorBgElevated: "#262626",
    colorBgLayout: "#141414",
    colorBgSpotlight: "#262626",

    // Text
    colorText: "#FFFFFF",
    colorTextSecondary: "#A6A6A6",
    colorTextTertiary: "#737373",
    colorTextQuaternary: "#595959",

    // Border
    colorBorder: "#303030",
    colorBorderSecondary: "#262626",

    // Border radius
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 4,

    // Font
    fontFamily:
      "'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,

    // Shadows
    boxShadow:
      "0 1px 2px 0 rgba(0, 0, 0, 0.4), 0 1px 6px -1px rgba(0, 0, 0, 0.3)",
    boxShadowSecondary:
      "0 6px 16px 0 rgba(0, 0, 0, 0.48), 0 3px 6px -4px rgba(0, 0, 0, 0.32)"
  },
  components: {
    Button: {
      colorPrimaryHover: brandColors.primaryHover,
      colorPrimaryActive: brandColors.primaryActive,
      borderRadius: 8
    },
    Input: {
      borderRadius: 8,
      colorBgContainer: "#262626"
    },
    Select: {
      borderRadius: 8,
      colorBgContainer: "#262626"
    },
    Card: {
      borderRadiusLG: 12,
      colorBgContainer: "#1F1F1F"
    },
    Table: {
      headerBg: "#262626",
      rowHoverBg: "#303030",
      colorBgContainer: "#1F1F1F"
    },
    Layout: {
      headerBg: "#141414",
      siderBg: "#141414",
      bodyBg: "#0A0A0A"
    },
    Menu: {
      itemSelectedBg: "rgba(160, 90, 255, 0.2)",
      itemSelectedColor: brandColors.primaryHover,
      itemHoverBg: "rgba(160, 90, 255, 0.1)",
      colorBgContainer: "#141414"
    }
  }
};
