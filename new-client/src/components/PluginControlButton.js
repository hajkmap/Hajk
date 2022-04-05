import React from "react";
import { Button, Paper, Tooltip } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles(theme => ({
  paper: {
    marginBottom: theme.spacing(1)
  },
  button: {
    minWidth: "unset"
  }
}));

export default function PluginControlButton({
  icon,
  onClick,
  title,
  abstract
}) {
  const classes = useStyles();

  return (
    <Tooltip title={`${title}: ${abstract}`}>
      <Paper className={classes.paper}>
        <Button aria-label={title} className={classes.button} onClick={onClick}>
          {icon}
        </Button>
      </Paper>
    </Tooltip>
  );
}
