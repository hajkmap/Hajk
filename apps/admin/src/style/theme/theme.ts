import { PaletteMode } from "@mui/material";
import { Theme, createTheme } from "@mui/material/styles";
import defaultComponentSizes from "./default-component-sizes";
import typography from "./typography";

export function getTheme(mode: PaletteMode): Theme {
  const isDarkMode = mode === "dark";

  return createTheme({
    palette: {
      mode: mode,
    },
    typography: { ...typography },
    components: {
      ...defaultComponentSizes,
      MuiPaper: {
        styleOverrides: {
          root: {
            "&:before": {
              display: "none", // Hide the fake top border on Accordion
            },
            backgroundColor: isDarkMode ? "#121212" : "#efefef",
            border: 0,
            boxShadow: "none",
            borderRadius: "8px", // Default is 4px
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            maxWidth: "calc(100% - 1rem)",
            border: 0,
            boxShadow: "none",
            borderRadius: "8px", // Default is 4px
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          content: {
            maxWidth: "calc(100% - 28px)",
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
            "&.Mui-disabled": {
              opacity: 0.5,
            },
          },
        },
      },
    },
  });
}

export default getTheme;
