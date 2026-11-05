import { PaletteMode } from "@mui/material";
import { Theme, createTheme } from "@mui/material/styles";
import defaultComponentSizes from "./default-component-sizes";
import typography from "./typography";

export function getTheme(mode: PaletteMode): Theme {
  // const isDarkMode = mode === "dark";

  return createTheme({
    palette: {
      mode: mode,
      text:
        mode === "dark"
          ? {
              primary: "rgba(255, 255, 255, 0.92)",
              secondary: "rgba(255, 255, 255, 0.66)",
            }
          : {
              primary: "rgba(0, 0, 0, 0.85)",
              secondary: "rgba(0, 0, 0, 0.6)",
            },
    },
    typography: { ...typography },
    components: {
      ...defaultComponentSizes,
      MuiFormControlLabel: {
        styleOverrides: {
          root: {
            // Keep the control on the first line when the label wraps.
            "&:has(> .MuiCheckbox-root, > .MuiRadio-root)": {
              alignItems: "flex-start",
              // (38px small control - 24px body1 line) / 2
              "& > .MuiFormControlLabel-label": { paddingTop: 7 },
            },
          },
        },
      },
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
