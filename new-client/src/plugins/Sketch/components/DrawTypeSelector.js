import React from "react";
import { TextField, MenuItem } from "@mui/material";
import { DRAW_TYPES } from "../constants";
import HajkToolTip from "../../../components/HajkToolTip";

const DrawTypeSelector = (props) => {
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
      {DRAW_TYPES.map((option) => (
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
