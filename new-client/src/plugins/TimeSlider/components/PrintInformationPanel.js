import React from "react";

import { Grid, Paper, Typography } from "@mui/material";

export default function PrintInformationPanel({ message }) {
  return (
    <Grid item xs={12} sx={{ p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography align="center">{message}</Typography>
      </Paper>
    </Grid>
  );
}
