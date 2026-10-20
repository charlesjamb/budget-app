const baseTheme = {
  radii: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    pill: "9999px",
  },
  font: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  space: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
  },
  fontSize: {
    xs: "12px",
    sm: "13px",
    md: "14px",
    lg: "16px",
    xl: "20px",
    xxl: "24px",
    hero: "40px",
  },
};

const lightColors = {
  primary: "#b45a30",
  primaryDark: "#984a26",
  onPrimary: "#ffffff",
  accentSoft: "#f6e6da",
  ok: "#3f8a5c",
  warn: "#b97a0f",
  over: "#c0392f",
  okSoft: "#e3f1e8",
  warnSoft: "#f8ecd0",
  overSoft: "#f8e1de",
  success: "#3f8a5c",
  warning: "#b97a0f",
  danger: "#c0392f",
  background: "#faf6ef",
  card: "#fffdf9",
  sidebar: "#f2ece1",
  text: "#2b2620",
  textMuted: "#6b6256",
  textLight: "#8f8576",
  border: "#e8e0d2",
  borderLight: "#ddd3c1",
  inputBorder: "#d6ccb9",
  overlay: "rgba(43, 38, 32, 0.4)",
};

const lightShadows = {
  card: "0 1px 3px rgba(60, 45, 25, 0.06), 0 1px 2px rgba(60, 45, 25, 0.04)",
  cardHover: "0 4px 16px rgba(60, 45, 25, 0.1)",
  focus: "0 0 0 2px rgba(180, 90, 48, 0.25)",
};

const darkColors = {
  primary: "#e08a5f",
  primaryDark: "#eba07a",
  onPrimary: "#1c1814",
  accentSoft: "#3a2a20",
  ok: "#6cc08a",
  warn: "#e0aa4a",
  over: "#ee7a6e",
  okSoft: "#1f3328",
  warnSoft: "#3a2f18",
  overSoft: "#3d2320",
  success: "#6cc08a",
  warning: "#e0aa4a",
  danger: "#ee7a6e",
  background: "#171411",
  card: "#211d18",
  sidebar: "#1c1814",
  text: "#f0e9de",
  textMuted: "#b0a696",
  textLight: "#877d6e",
  border: "#322c24",
  borderLight: "#40382d",
  inputBorder: "#40382d",
  overlay: "rgba(0, 0, 0, 0.6)",
};

const darkShadows = {
  card: "0 1px 3px rgba(0, 0, 0, 0.35)",
  cardHover: "0 4px 16px rgba(0, 0, 0, 0.45)",
  focus: "0 0 0 2px rgba(224, 138, 95, 0.35)",
};

export const lightTheme = {
  ...baseTheme,
  colorScheme: "light" as "light" | "dark",
  colors: lightColors,
  shadows: lightShadows,
};

export const darkTheme = {
  ...baseTheme,
  colorScheme: "dark" as "light" | "dark",
  colors: darkColors,
  shadows: darkShadows,
};

/** @deprecated Use lightTheme or darkTheme. Kept for backward compatibility in tests. */
export const theme = lightTheme;

export type Theme = typeof lightTheme;
