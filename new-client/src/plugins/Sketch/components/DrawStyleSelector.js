import React from "react";
import { Button, Box, Grid } from "@material-ui/core";
import { Tooltip, Typography } from "@material-ui/core";

const DrawStyleSelector = (props) => {
  // We want to be able to display the current color. Let's create
  // a color-badge component.
  const ColorBadge = ({ color }) => {
    return (
      <Box
        style={{
          height: "1.1rem",
          width: "1.1rem",
          backgroundColor: color,
          borderRadius: "10%",
        }}
      />
    );
  };

  // We're gonna need a button which the user can interact with to change the color.
  // The button opens a dialog in which the current color can be changed.
  const ColorSelectorButton = ({ color, title }) => {
    return (
      <Tooltip title={`Klicka här för att ändra ${title.toLowerCase()}.`}>
        <Button
          variant="contained"
          size="small"
          style={{ width: "100%", marginBottom: 8 }}
        >
          <Grid container justify="space-between" alignItems="center">
            <Typography>{title}</Typography>
            <ColorBadge color={color} />
          </Grid>
        </Button>
      </Tooltip>
    );
  };

  return (
    <Grid item xs={12}>
      <ColorSelectorButton
        type={"STROKE"}
        color={props.drawColor.stroke}
        title={"Linjefärg"}
      />
      <ColorSelectorButton
        type={"FILL"}
        color={props.drawColor.fill}
        title={"Fyllnadsfärg"}
      />
    </Grid>
  );
};

export default DrawStyleSelector;
