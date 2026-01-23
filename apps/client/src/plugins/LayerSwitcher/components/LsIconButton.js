import React from "react";
import IconButton from "@mui/material/IconButton";

const LsIconButton = ({ children, id, ...props }) => (
  <IconButton id={id} disableTouchRipple {...props}>
    {children}
  </IconButton>
);

export default LsIconButton;
