// Base
import React from "react";
import { Grid, MenuItem, TextField } from "@mui/material";

import { MAP_INTERACTION_INFO } from "../../constants";

function MapInteractionSelector({ interaction, handleChange, disabled }) {
  const interactions = MAP_INTERACTION_INFO.filter(
    (interaction) => interaction.useInEditView === true
  );

  return (
    <Grid container sx={{ ml: 1, mr: 1 }} justifyContent="center">
      <Grid item xs={12}>
        <TextField
          disabled={disabled}
          fullWidth
          id="edit-interaction-select"
          variant="outlined"
          size="small"
          select
          value={interaction}
          onChange={handleChange}
        >
          {interactions.map((info) => (
            <MenuItem key={info.id} value={info.id}>
              {<span style={{ width: "100%" }}>{info.name}</span>}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </Grid>
  );
}

export default MapInteractionSelector;
