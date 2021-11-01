import React from "react";
import { Grid, Paper } from "@material-ui/core";
import { Tooltip } from "@material-ui/core";
import ToggleButton from "@material-ui/lab/ToggleButton";
import EditIcon from "@material-ui/icons/Edit";
import Crop54Icon from "@material-ui/icons/Crop54";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import TouchAppIcon from "@material-ui/icons/TouchApp";
import RotateLeftIcon from "@material-ui/icons/RotateLeft";

const DrawToolbox = (props) => {
  const drawButtons = [
    {
      type: "POLYGON",
      tooltip:
        "Rita en yta i kartan genom att klicka en gång per nod, avlsuta med ett dubbelklick.",
      icon: <EditIcon />,
    },
    {
      type: "RECTANGLE",
      tooltip: "Rita en rektangel i kartan.",
      icon: <Crop54Icon />,
    },
    {
      type: "CIRCLE",
      tooltip: "Rita en cirkel i kartan.",
      icon: <RadioButtonUncheckedIcon />,
    },
    {
      type: "SELECT",
      tooltip: "Välj från befintliga objekt i kartan.",
      icon: <TouchAppIcon />,
    },
    {
      type: "RESET",
      tooltip: "Blev du inte nöjd? Ta bort alla objekt från kartan.",
      icon: <RotateLeftIcon />,
    },
  ];

  function renderToggleButton(button, index) {
    const { activeDrawButton, handleDrawButtonClick } = props;
    return (
      <Tooltip key={index} title={button.tooltip}>
        <ToggleButton
          selected={button.type === activeDrawButton}
          onChange={() => handleDrawButtonClick(button.type)}
          value={button.type}
          style={{ margin: 8 }}
          aria-label={button.tooltip}
        >
          {button.icon}
        </ToggleButton>
      </Tooltip>
    );
  }

  return (
    <Paper style={{ marginTop: 8 }}>
      <Grid container>
        <Grid container item xs={12} justify="space-between">
          {drawButtons.map((button, index) => {
            return renderToggleButton(button, index);
          })}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DrawToolbox;
