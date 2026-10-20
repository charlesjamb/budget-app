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
  primary: "#5f73b5",
  primaryDark: "#4d609f",
  onPrimary: "#ffffff",
  accentSoft: "#edf0fa",
  ok: "#2a8160",
  warn: "#8f6617",
  over: "#bf524c",
  okSoft: "#e8f4ee",
  warnSoft: "#faf2e0",
  overSoft: "#f9e9e8",
  success: "#2a8160",
  warning: "#8f6617",
  danger: "#bf524c",
  background: "#f9fafd",
  card: "#ffffff",
  sidebar: "#f1f3f9",
  text: "#2a2f45",
  textMuted: "#6a7089",
  textLight: "#8b90a6",
  border: "#eceef6",
  borderLight: "#dde1ee",
  inputBorder: "#d3d8e8",
  overlay: "rgba(42, 47, 69, 0.4)",
};

const lightShadows = {
  card: "0 1px 3px rgba(40, 50, 90, 0.06), 0 1px 2px rgba(40, 50, 90, 0.04)",
  cardHover: "0 4px 16px rgba(40, 50, 90, 0.1)",
  focus: "0 0 0 2px rgba(95, 115, 181, 0.25)",
};

const darkColors = {
  primary: "#9db0ec",
  primaryDark: "#b4c2f2",
  onPrimary: "#1c2030",
  accentSoft: "#2e3558",
  ok: "#7bd0ab",
  warn: "#e6c07a",
  over: "#f19a92",
  okSoft: "#21403a",
  warnSoft: "#3b3320",
  overSoft: "#44292a",
  success: "#7bd0ab",
  warning: "#e6c07a",
  danger: "#f19a92",
  background: "#1c2030",
  card: "#252a3c",
  sidebar: "#212536",
  text: "#eceef8",
  textMuted: "#aab0c8",
  textLight: "#868cab",
  border: "#333852",
  borderLight: "#404663",
  inputBorder: "#404663",
  overlay: "rgba(0, 0, 0, 0.6)",
};

const darkShadows = {
  card: "0 1px 3px rgba(0, 0, 0, 0.35)",
  cardHover: "0 4px 16px rgba(0, 0, 0, 0.45)",
  focus: "0 0 0 2px rgba(157, 176, 236, 0.35)",
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
