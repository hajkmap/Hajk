import React from "react";
import Tooltip from "@mui/material/Tooltip";

const HajkToolTip = ({ title, children, ...props }) => {
  return (
    <Tooltip
      enterDelay={500}
      leaveDelay={50}
      disableInteractive={true}
      title={title || ""}
      {...props}
    >
      {children || <></>}
    </Tooltip>
  );
};

export default HajkToolTip;
