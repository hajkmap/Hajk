// Base
import React from "react";
import { Divider, Grid } from "@mui/material";

function SmallDivider({ mt = 0, mb = 1 }) {
  return (
    <Grid container sx={{ mt: mt, mb: mb }} justifyContent="center">
      <Divider sx={{ width: "20%" }} />
    </Grid>
  );
}

export default SmallDivider;
