import React from "react";
import IconButton from "@mui/material/IconButton";

const LsIconButton = ({ children, ...props }) => (
  <IconButton disableTouchRipple {...props}>
    {children}
  </IconButton>
);

export default LsIconButton;
