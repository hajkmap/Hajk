import React from "react";
import { Grid, MenuItem, Paper } from "@material-ui/core";
import { TextField, Tooltip, Typography } from "@material-ui/core";
import { STROKE_DASHES } from "../constants";

const StrokeTypeSelector = (props) => {
  return (
    <Paper
      style={{ padding: props.includeContainer !== false ? 8 : 0 }}
      elevation={props.includeContainer !== false ? 3 : 0}
    >
      <Grid container>
        <Grid item xs={12}>
          <Typography variant="caption">Linjetyp</Typography>
        </Grid>
        <TextField
          fullWidth
          id="select-stroke-type"
          variant="outlined"
          size="small"
          select
          value={props.strokeType}
          onChange={props.handleStrokeTypeChange}
        >
          {STROKE_DASHES.map((option) => (
            <MenuItem key={option.type} value={option.type}>
              {
                <Tooltip title={option.tooltip}>
                  <span style={{ width: "100%" }}>{option.label}</span>
                </Tooltip>
              }
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </Paper>
  );
};

export default StrokeTypeSelector;
