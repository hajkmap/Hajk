import { useState, createContext, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import getTheme from "./theme/theme";
import { PaletteMode, useMediaQuery } from "@mui/material";

export interface ThemeContextType {
  mode: PaletteMode;
  setMode: (mode: PaletteMode) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export default function ThemeRegistry(props: { children: React.ReactNode }) {
  const { children } = props;
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const [mode, setLocalMode] = useState<PaletteMode>(
    prefersDarkMode ? "dark" : "light"
  );

  useEffect(() => {
    const themeFromLs = window.localStorage.getItem("userPreferredTheme")
      ? window.localStorage.getItem("userPreferredTheme") ?? ""
      : "";
    const defaultTheme = (
      ["light", "dark"].includes(themeFromLs)
        ? themeFromLs
        : prefersDarkMode
        ? "dark"
        : "light"
    ) as PaletteMode;
    setMode(defaultTheme);
  }, [prefersDarkMode]);

  const theme = getTheme(mode);

  function setMode(mode: PaletteMode) {
    window.localStorage.setItem("userPreferredTheme", mode);
    setLocalMode(mode);
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
      }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
