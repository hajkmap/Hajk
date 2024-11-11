import React from "react";
import { Grid, MenuItem, Paper } from "@mui/material";
import { TextField, Typography } from "@mui/material";
import { STROKE_TYPES } from "../../constants";
import HajkToolTip from "components/HajkToolTip";

const StrokeTypeSelector = (props) => {
  // This filter is used to remove the "none" strokeType from the select when the activeDrawType is anything but "Circle" or "Polygon"
  // This is because the "none" strokeType is only available for the activeDrawTypes "Circle" and "Polygon"
  const filteredStrokeTypes =
    props.activeDrawType === "Circle" || props.activeDrawType === "Polygon"
      ? STROKE_TYPES
      : STROKE_TYPES.filter((strokeType) => strokeType.type !== "none");

  // We want to set the initial strokeType to the current strokeType if it's available in the filteredStrokeTypes
  // Otherwise we want to set it to the first available strokeType ("none").
  const initialStrokeType = filteredStrokeTypes.find(
    (option) => option.type === props.strokeType
  )
    ? props.strokeType
    : filteredStrokeTypes[0]?.type;

  return (
    <Paper
      style={{ padding: props.includeContainer !== false ? 8 : 0 }}
      elevation={props.includeContainer !== false ? 3 : 0}
    >
      <Grid container>
        {props.includeContainer !== false ? (
          <Grid item xs={12}>
            <Typography variant="caption">Linjetyp</Typography>
          </Grid>
        ) : null}
        <TextField
          fullWidth
          id="select-stroke-type"
          variant="outlined"
          size="small"
          select
          value={initialStrokeType}
          onChange={props.handleStrokeTypeChange}
        >
          {filteredStrokeTypes.map((option) => {
            return (
              <MenuItem key={option.type} value={option.type}>
                {
                  <HajkToolTip title={option.tooltip}>
                    <span style={{ width: "100%" }}>{option.label}</span>
                  </HajkToolTip>
                }
              </MenuItem>
            );
          })}
        </TextField>
      </Grid>
    </Paper>
  );
};

export default StrokeTypeSelector;
