export const theme = {
  colors: {
    primary: "#6366f1",
    primaryDark: "#4f46e5",
    violet: "#8b5cf6",
    success: "#10b981",
    successLight: "#34d399",
    warning: "#f59e0b",
    warningLight: "#fbbf24",
    danger: "#ef4444",
    dangerLight: "#f87171",
    background: "#f8f7ff",
    card: "#ffffff",
    text: "#111827",
    textMuted: "#6b7280",
    textLight: "#9ca3af",
    border: "#e5e7eb",
    borderLight: "#e0e0e0",
    inputBorder: "#d1d5db",
  },
  gradients: {
    primary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    success: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
    warning: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    danger: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
  },
  shadows: {
    card: "0 2px 12px rgba(0, 0, 0, 0.06)",
    cardHover: "0 4px 20px rgba(0, 0, 0, 0.1)",
    button: "0 2px 8px rgba(99, 102, 241, 0.3)",
    focus: "0 0 0 2px rgba(99, 102, 241, 0.2)",
  },
  radii: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    pill: "9999px",
  },
  font: {
    family:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
} as const;

export type Theme = typeof theme;
