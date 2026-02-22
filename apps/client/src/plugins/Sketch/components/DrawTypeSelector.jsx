import React from "react";
import { TextField, MenuItem } from "@mui/material";
import { DRAW_TYPES } from "../constants";
import HajkToolTip from "components/HajkToolTip";

const DrawTypeSelector = (props) => {
  const { allowedTypes = null } = props;

  // Filter drawtypes if allowedTypes is set
  const drawTypes = allowedTypes
    ? DRAW_TYPES.filter((dt) => allowedTypes.includes(dt.type))
    : DRAW_TYPES;

  return (
    <TextField
      fullWidth
      id="select-draw-type"
      variant="outlined"
      size="small"
      select
      value={props.activeDrawType}
      onChange={(e) => props.setActiveDrawType(e.target.value)}
    >
      {drawTypes.map((option) => (
        <MenuItem key={option.type} value={option.type}>
          {
            <HajkToolTip title={option.tooltip}>
              <span style={{ width: "100%" }}>{option.label}</span>
            </HajkToolTip>
          }
        </MenuItem>
      ))}
    </TextField>
  );
};

export default DrawTypeSelector;
