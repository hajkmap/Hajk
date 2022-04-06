import React from "react";
import { TextField, MenuItem, Tooltip } from "@material-ui/core";
import { DRAW_TYPES } from "../constants";

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
            <Tooltip title={option.tooltip}>
              <span style={{ width: "100%" }}>{option.label}</span>
            </Tooltip>
          }
        </MenuItem>
      ))}
    </TextField>
  );
};

export default DrawTypeSelector;
