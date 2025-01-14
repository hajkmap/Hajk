import { PaletteMode } from "@mui/material";
import { Theme, createTheme } from "@mui/material/styles";
import defaultComponentSizes from "./default-component-sizes";
import typography from "./typography";

export function getTheme(mode: PaletteMode): Theme {
  return createTheme({
    palette: {
      mode: mode,
    },
    components: {
      ...defaultComponentSizes,
    },
    typography: { ...typography },
  });
}

export default getTheme;
