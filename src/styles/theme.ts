export const lightTheme = {
  colors: {
    primary: "#2d5244",
    primaryDark: "#1f3b30",
    primaryLight: "#c8e9c2",
    bg: "#f9f9f8",
    surface: "#ffffff",
    text: "#1a1a1a",
    textMuted: "#767676",
    border: "#e7e6e2",
    overlay: "rgba(20, 24, 20, 0.45)",
  },
  radius: {
    sm: "10px",
    md: "16px",
    lg: "22px",
    pill: "999px",
  },
  shadow: {
    card: "0 4px 14px rgba(26, 26, 26, 0.06)",
    float: "0 8px 24px rgba(26, 26, 26, 0.12)",
  },
  space: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "16px",
    6: "24px",
    8: "32px",
  },
  typography: {
    fontBase: "-apple-system, 'Apple SD Gothic Neo', 'Pretendard', 'Malgun Gothic', Roboto, 'Segoe UI', sans-serif",
    fontBrand: "'Georgia', 'Apple SD Gothic Neo', serif",
  },
  layout: {
    appMaxWidth: "403px",
    bottomNavHeight: "60px",
  }
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    primary: "#c8e9c2",
    primaryDark: "#2d5244",
    primaryLight: "rgba(200, 233, 194, 0.15)",
    bg: "#121212",
    surface: "#1e1e1e",
    text: "#e0e0e0",
    textMuted: "#a0a0a0",
    border: "#2d2d2d",
    overlay: "rgba(0, 0, 0, 0.75)",
  },
  shadow: {
    card: "0 4px 14px rgba(0, 0, 0, 0.3)",
    float: "0 8px 24px rgba(0, 0, 0, 0.4)",
  }
};

export const theme = lightTheme;
export type ThemeType = typeof lightTheme;
