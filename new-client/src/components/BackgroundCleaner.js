import React from "react";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";

export default function BackgroundCleaner(props) {
  return (
    <Tooltip title="Dölj alla aktiva lager">
      <IconButton
        color="primary"
        aria-label="Rensa kartan"
        onClick={e => {
          props.appModel.clear();
        }}
      >
        <VisibilityOffIcon />
      </IconButton>
    </Tooltip>
  );
}
