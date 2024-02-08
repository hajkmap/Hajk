import React from "react";
import { Grid, MenuItem, Paper } from "@mui/material";
import { TextField, Tooltip, Typography } from "@mui/material";
import { STROKE_TYPES } from "../../constants";

const StrokeTypeSelector = (props) => {
  const filteredStrokeTypes =
    props.activeDrawType === "Circle" || props.activeDrawType === "Polygon"
      ? STROKE_TYPES
      : STROKE_TYPES.filter((strokeType) => strokeType.type !== "none");

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
          value={props.strokeType}
          onChange={props.handleStrokeTypeChange}
        >
          {filteredStrokeTypes.map((option) => {
            return (
              <MenuItem key={option.type} value={option.type}>
                {
                  <Tooltip disableInteractive title={option.tooltip}>
                    <span style={{ width: "100%" }}>{option.label}</span>
                  </Tooltip>
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
