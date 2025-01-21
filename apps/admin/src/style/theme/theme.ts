import { PaletteMode } from "@mui/material";
import { Theme, createTheme } from "@mui/material/styles";
import defaultComponentSizes from "./default-component-sizes";
import typography from "./typography";

export function getTheme(mode: PaletteMode): Theme {
  // const isDarkMode = mode === "dark";

  return createTheme({
    palette: {
      mode: mode,
    },
    typography: { ...typography },
    components: {
      ...defaultComponentSizes,
      MuiPaper: {
        styleOverrides: {
          root: {},
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {},
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          content: {},
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {},
        },
      },
    },
  });
}

export default getTheme;
