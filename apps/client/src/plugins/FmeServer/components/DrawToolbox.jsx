import { Grid, Paper } from "@mui/material";
import ToggleButton from "@mui/material/ToggleButton";
import EditIcon from "@mui/icons-material/Edit";
import Crop54Icon from "@mui/icons-material/Crop54";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import HajkToolTip from "components/HajkToolTip";
import i18n from "src/i18n";

const DrawToolbox = (props) => {
  const drawButtons = [
    {
      type: "Polygon", // Open-layers does not like all caps!
      tooltip: i18n.t("fmeServer.draw.polygon"),
      icon: <EditIcon />,
    },
    {
      type: "Rectangle",
      tooltip: i18n.t("fmeServer.draw.rectangle"),
      icon: <Crop54Icon />,
    },
    {
      type: "Circle",
      tooltip: i18n.t("fmeServer.draw.circle"),
      icon: <RadioButtonUncheckedIcon />,
    },
    {
      type: "Select",
      tooltip: i18n.t("fmeServer.draw.select"),
      icon: <TouchAppIcon />,
    },
    {
      type: "Reset",
      tooltip: i18n.t("fmeServer.draw.reset"),
      icon: <RotateLeftIcon />,
    },
  ];

  function renderToggleButton(button, index) {
    const { activeDrawButton, handleDrawButtonClick } = props;
    return (
      <HajkToolTip key={index} title={button.tooltip}>
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
    );
  }

  return (
    <Paper sx={{ marginTop: 1 }}>
      <Grid container>
        <Grid
          container
          size={12}
          sx={{
            justifyContent: "space-between",
          }}
        >
          {drawButtons.map((button, index) => {
            return renderToggleButton(button, index);
          })}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DrawToolbox;
