import { PaletteMode } from "@mui/material";
import { Theme, createTheme } from "@mui/material/styles";

export function getTheme(mode: PaletteMode): Theme {
  return createTheme({
    palette: {
      mode: mode,
    },
  });
}

export default getTheme;
