import React from "react";
import { Grid, Paper } from "@mui/material";
import ToggleButton from "@mui/material/ToggleButton";
import EditIcon from "@mui/icons-material/Edit";
import Crop54Icon from "@mui/icons-material/Crop54";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import HajkToolTip from "components/HajkToolTip";

const DrawToolbox = (props) => {
  const drawButtons = [
    {
      type: "Polygon", // Open-layers does not like all caps!
      tooltip:
        "Rita en yta i kartan genom att klicka en gång per nod, avlsuta med ett dubbelklick.",
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
      tooltip: "Välj från befintliga objekt i kartan.",
      icon: <TouchAppIcon />,
    },
    {
      type: "Reset",
      tooltip: "Blev du inte nöjd? Ta bort alla objekt från kartan.",
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
        <Grid container item xs={12} justifyContent="space-between">
          {drawButtons.map((button, index) => {
            return renderToggleButton(button, index);
          })}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DrawToolbox;
