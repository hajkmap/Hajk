import { createContext } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import getTheme from "./theme/theme";
import { PaletteMode } from "@mui/material";
import useAppStateStore from "../store/use-app-state-store";
import { GlobalStylesComponent } from "./theme/global-styles";

export interface ThemeContextType {
  mode: PaletteMode;
  setMode: (mode: PaletteMode) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export default function ThemeRegistry(props: { children: React.ReactNode }) {
  const { children } = props;

  const themeMode = useAppStateStore((state) => state.themeMode);
  const setThemeMode = useAppStateStore((state) => state.setThemeMode);

  const theme = getTheme(themeMode);

  return (
    <ThemeContext.Provider
      value={{
        mode: themeMode,
        setMode: setThemeMode,
      }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStylesComponent mode={themeMode} />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
