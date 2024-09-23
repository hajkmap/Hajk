import { PaletteMode } from "@mui/material";
import { Theme, createTheme } from "@mui/material/styles";

export function getTheme(mode: PaletteMode): Theme {
  return createTheme({
    palette: {
      mode: mode,
      primary: {
        main: mode === "light" ? "#0076bc" : "#2d5e7a",
        light: mode === "light" ? "#c0e4f2" : "#021b29",
      },
      secondary: {
        main: mode === "light" ? "#008767" : "#013b2d",
        light: mode === "light" ? "#b8e1c8" : "#126350",
      },
    },
  });
}

export default getTheme;
