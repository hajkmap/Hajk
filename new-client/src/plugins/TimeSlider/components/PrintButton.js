import React from "react";

import { Button, Grid, Tooltip } from "@mui/material";
import { PRINT_DISABLED_TOOLTIP, PRINT_ENABLED_TOOLTIP } from "../constants";

export default function PrintButton({ disabled, onClick }) {
  return (
    <Grid container item xs={12} justifyContent="center" alignContent="center">
      <Tooltip
        title={disabled ? PRINT_DISABLED_TOOLTIP : PRINT_ENABLED_TOOLTIP}
      >
        <span>
          <Button variant="contained" onClick={onClick} disabled={disabled}>
            Skriv ut
          </Button>
        </span>
      </Tooltip>
    </Grid>
  );
}
