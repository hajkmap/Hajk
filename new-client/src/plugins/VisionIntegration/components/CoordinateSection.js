// Base
import React from "react";
import { Grid, Typography } from "@mui/material";

function CoordinateSection(props) {
  const headerText = "Det finns inga selekterade koordinater";
  const helperText =
    "Aktivera verktyget och klicka i kartan för att välja koordinater.";
  return (
    <Grid container sx={{ padding: 2 }}>
      <Grid container item xs={12}>
        <Typography variant="h6" align="center" sx={{ width: "100%" }}>
          {headerText}
        </Typography>
        {helperText !== "" && (
          <Typography variant="caption" align="center" sx={{ width: "100%" }}>
            {helperText}
          </Typography>
        )}
      </Grid>
    </Grid>
  );
}

export default CoordinateSection;
