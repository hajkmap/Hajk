import { useTheme } from "@mui/material/styles";
import { getThemedLegendGraphicUrl } from "../LayerSwitcherUtils";

export default function LegendIcon({ url }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <img
      alt="Teckenförklaringsikon"
      src={getThemedLegendGraphicUrl(url, isDarkMode)}
      style={{
        width: "18px",
        height: "18px",
        marginRight: "5px",
        marginTop: "8px",
        visibility: url ? "visible" : "hidden",
      }}
    ></img>
  );
}
