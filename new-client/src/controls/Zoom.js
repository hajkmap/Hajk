import React from "react";
import { easeOut } from "ol/easing";
import { Button, Paper } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import RemoveIcon from "@material-ui/icons/Remove";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles(theme => ({
  paper: {
    marginBottom: theme.spacing(1)
  },
  button: {
    minWidth: "unset"
  }
}));

const ZoomControl = React.memo(props => {
  const classes = useStyles();

  function zoomByDelta(delta) {
    if (!props.map) return;
    const view = props.map.getView();

    if (!view) return;
    const currentZoom = view.getZoom();

    if (currentZoom !== undefined) {
      const newZoom = currentZoom + delta;

      // TODO: Duration could be an option from map config, allowing admin to disable zoom animation
      const duration = 200;
      if (duration > 0) {
        if (view.getAnimating()) {
          view.cancelAnimations();
        }
        view.animate({
          zoom: newZoom,
          duration: duration,
          easing: easeOut
        });
      } else {
        view.setZoom(newZoom);
      }
    }
  }

  return (
    <Paper className={classes.paper}>
      <Button
        aria-label="Zooma in"
        className={classes.button}
        onClick={() => {
          zoomByDelta(1);
        }}
      >
        <AddIcon />
      </Button>
      <Button
        aria-label="Zooma ut"
        className={classes.button}
        onClick={() => {
          zoomByDelta(-1);
        }}
      >
        <RemoveIcon />
      </Button>
    </Paper>
  );
});

export default ZoomControl;
