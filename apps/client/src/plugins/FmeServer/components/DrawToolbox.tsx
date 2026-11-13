import { Grid, Paper } from "@mui/material";
import ToggleButton from "@mui/material/ToggleButton";
import EditIcon from "@mui/icons-material/Edit";
import Crop54Icon from "@mui/icons-material/Crop54";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import HajkToolTip from "components/HajkToolTip";
import type { DrawToolboxProps } from "../types";

interface DrawButton {
  type: string;
  tooltip: string;
  icon: React.ReactNode;
}

const DRAW_BUTTONS: DrawButton[] = [
  {
    type: "Polygon",
    tooltip:
      "Rita en yta i kartan genom att klicka en gång per nod, avsluta med ett dubbelklick.",
    icon: <EditIcon />,
  },
  {
    type: "Rectangle",
    tooltip: "Rita en rektangel i kartan.",
    icon: <Crop54Icon />,
  },
  {
    type: "Circle",
    tooltip: "Rita en cirkel i kartan.",
    icon: <RadioButtonUncheckedIcon />,
  },
  {
    type: "Select",
    tooltip:
      "Välj från befintliga objekt i kartan. Håll ner Ctrl på Windows eller Cmd (⌘) på Mac för att välja flera objekt.",
    icon: <TouchAppIcon />,
  },
  {
    type: "Reset",
    tooltip: "Blev du inte nöjd? Ta bort alla objekt från kartan.",
    icon: <RotateLeftIcon />,
  },
];

const DrawToolbox = ({
  activeDrawButton,
  handleDrawButtonClick,
}: DrawToolboxProps) => (
  <Paper sx={{ marginTop: 1 }}>
    <Grid container>
      <Grid container size={12} sx={{ justifyContent: "space-between" }}>
        {DRAW_BUTTONS.map((button) => (
          <HajkToolTip key={button.type} title={button.tooltip}>
            <ToggleButton
              selected={button.type === activeDrawButton}
              onChange={() => handleDrawButtonClick(button.type)}
              value={button.type}
              sx={{ margin: 1 }}
              aria-label={button.tooltip}
            >
              {button.icon}
            </ToggleButton>
          </HajkToolTip>
        ))}
      </Grid>
    </Grid>
  </Paper>
);

export default DrawToolbox;
