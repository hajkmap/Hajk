import React from "react";
import { Button, Paper, Tooltip } from "@material-ui/core";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";

import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles(theme => ({
  paper: {
    marginBottom: theme.spacing(1)
  },
  button: {
    minWidth: "unset"
  }
}));

export default function BackgroundCleaner(props) {
  const classes = useStyles();

  return (
    <Tooltip title="Dölj alla aktiva lager">
      <Paper className={classes.paper}>
        <Button
          aria-label="Rensa kartan"
          className={classes.button}
          onClick={e => {
            props.appModel.clear();
          }}
        >
          <VisibilityOffIcon />
        </Button>
      </Paper>
    </Tooltip>
  );
}
