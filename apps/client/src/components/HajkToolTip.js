import React, { useState } from "react";
import Tooltip from "@mui/material/Tooltip";

const HajkToolTip = ({ title, children, ...props }) => {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip
      enterDelay={500}
      leaveDelay={50}
      disableInteractive={true}
      title={title || ""}
      open={open}
      {...props}
    >
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(false)}
      >
        {children || <></>}
      </span>
    </Tooltip>
  );
};

export default HajkToolTip;
