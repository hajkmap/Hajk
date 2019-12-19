import React, { useState } from "react";
import { easeOut } from "ol/easing";
import { Button, Paper, Tooltip } from "@material-ui/core";
import NavigationIcon from "@material-ui/icons/Navigation";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles(theme => ({
  paper: {
    marginBottom: theme.spacing(1)
  },
  button: {
    minWidth: "unset"
  }
}));

const RotateControl = React.memo(props => {
  if (!props.map) return;

  const classes = useStyles();
  const view = props.map.getView();
  const [rotation, setRotation] = useState(view.getRotation());

  // Subscribe to View's rotation change event. When this happens,
  // we want to read the new rotation and put in state.
  // The reason is that we don't want to show Rotate Control if
  // rotation already is 0 (north).
  view.on("change:rotation", e => {
    setRotation(view.getRotation());
  });

  function rotateNorth() {
    // TODO: This could be an option in admin
    const duration = 400;

    if (!view) return;

    if (rotation !== undefined) {
      // If 'duration' will be an option, we must see if user wants to animate or not
      if (duration > 0) {
        view.animate({
          rotation: 0,
          duration: duration,
          easing: easeOut
        });
      } else {
        view.setRotation(0);
      }
    }
  }

  return (
    rotation !== 0 && (
      <Tooltip title="Återställ rotation">
        <Paper className={classes.paper}>
          <Button
            aria-label="Återställ rotation"
            className={classes.button}
            onClick={rotateNorth}
          >
            <NavigationIcon style={{ transform: `rotate(${rotation}rad)` }} />
          </Button>
        </Paper>
      </Tooltip>
    )
  );
});

export default RotateControl;
