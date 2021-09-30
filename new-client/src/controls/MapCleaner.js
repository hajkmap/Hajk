import React from "react";
import { Button, Paper, Tooltip } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginBottom: theme.spacing(1),
  },
  button: {
    minWidth: "unset",
  },
}));

/**
 * @summary Hides all visible layers
 *
 * @param {object} props
 * @returns {object} React
 */
const MapCleaner = React.memo((props) => {
  const classes = useStyles();

  return (
    props.appModel.config.mapConfig.map.mapcleaner && (
      <Tooltip title="Dölj alla aktiva lager">
        <Paper className={classes.paper}>
          <Button
            aria-label="Rensa kartan"
            className={classes.button}
            onClick={(e) => {
              props.appModel.clear();
            }}
          >
            <VisibilityOffIcon />
          </Button>
        </Paper>
      </Tooltip>
    )
  );
});

export default MapCleaner;
