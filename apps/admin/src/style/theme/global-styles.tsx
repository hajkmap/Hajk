import { PaletteMode } from "@mui/material";
import { GlobalStyles } from "@mui/system";

export function GlobalStylesComponent({ mode }: { mode: PaletteMode }) {
  const isDarkMode = mode === "dark";

  return (
    <GlobalStyles
      styles={{
        ".form-factory .MuiPaper-root": {
          "&:before": {
            display: "none", // Hide the fake top border on Accordion
          },
          backgroundColor: isDarkMode ? "#121212" : "#efefef",
          border: 0,
          boxShadow: "none",
          borderRadius: "8px", // Default is 4px
        },
        ".form-factory .MuiAccordion-root": {
          maxWidth: "calc(100% - 1rem)",
          border: 0,
          boxShadow: "none",
          borderRadius: "8px", // Default is 4px
        },
        ".form-factory .MuiAccordionSummary-content": {
          maxWidth: "calc(100% - 28px)",
        },
        ".form-factory .MuiInputBase-root": {
          backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
          "&.Mui-disabled": {
            opacity: 0.5,
          },
        },
        ".form-factory .MuiPaper-root .MuiGrid2-root > .MuiGrid2-root > .MuiGrid2-root":
          {
            // Fix for nested grids which is generated when helpText is added.
            width: "100%",
          },
        ".form-container .MuiPaper-root": {
          "&:before": {
            display: "none", // Hide the fake top border on Accordion
          },
          maxWidth: "calc(100% - 1rem)",
          backgroundColor: isDarkMode ? "#121212" : "#efefef",
          border: 0,
          boxShadow: "none",
          borderRadius: "8px", // Default is 4px
        },
        ".form-container .MuiAccordion-root": {
          border: 0,
          boxShadow: "none",
          borderRadius: "8px", // Default is 4px
        },
        // ".form-factory .MuiAccordionDetails-root": {
        //   paddingTop: "16px",
        // },
        ".form-container .MuiAccordionSummary-content": {
          maxWidth: "calc(100% - 28px)",
        },
        ".form-container .MuiInputBase-root": {
          backgroundColor: isDarkMode ? "#3b3b3b" : "#fbfbfb",
          "&.Mui-disabled": {
            opacity: 0.5,
          },
        },
        ".form-container .MuiFormLabel-root": {
          color: isDarkMode ? "#fff" : "rgba(0, 0, 0, 0.87)",
          "&.Mui-focused": {
            color: isDarkMode ? "#fff" : "rgba(0, 0, 0, 0.87)",
          },
        },
        ".form-container .MuiPaper-root .MuiGrid2-root > .MuiGrid2-root > .MuiGrid2-root":
          {
            // Fix for nested grids which is generated when helpText is added.
            width: "100%",
          },
        ".form-container [class*='MuiGrid2-grid']": {
          // Target all MuiGrid2-grid classes including MuiGrid2-grid-xs-12, etc.
          paddingBottom: "16px",
          paddingLeft: "16px",
        },
      }}
    />
  );
}
