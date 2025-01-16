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
      }}
    />
  );
}
