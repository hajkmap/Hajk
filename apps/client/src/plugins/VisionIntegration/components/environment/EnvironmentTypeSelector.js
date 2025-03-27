// Base
import React from "react";
import { Grid, MenuItem, TextField, Typography } from "@mui/material";

import { ENVIRONMENT_INFO } from "plugins/VisionIntegration/constants";

function EnvironmentTypeSelector({ type, handleChange }) {
  return (
    <Grid container sx={{ ml: 1, mr: 1 }} justifyContent="center">
      <Grid item xs={12} sx={{ mb: 0.5 }}>
        <Typography align="center">Typ</Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          id="environment-select"
          variant="outlined"
          size="small"
          select
          value={type}
          onChange={handleChange}
        >
          {ENVIRONMENT_INFO.map((info) => (
            <MenuItem key={info.id} value={info.id}>
              {<span style={{ width: "100%" }}>{info.name}</span>}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </Grid>
  );
}

export default EnvironmentTypeSelector;
