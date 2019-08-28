import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";

const useStyles = makeStyles(theme => ({
  icon: {
    padding: "3px"
  }
}));

export default function BackgroundCleaner(props) {
  const classes = useStyles();

  return (
    <Tooltip title="Dölj alla aktiva lager">
      <Button
        aria-label="Rensa kartan"
        onClick={e => {
          props.appModel.clear();
        }}
      >
        <VisibilityOffIcon className={classes.icon} />
        Rensa kartan
      </Button>
    </Tooltip>
  );
}
