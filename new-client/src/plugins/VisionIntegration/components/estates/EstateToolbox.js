// Base
import React from "react";
import { Divider, Stack, Grid, Paper, Switch, Typography } from "@mui/material";

function EstateToolbox(props) {
  return (
    <Grid container item xs={12} justifyContent="center" alignContent="center">
      <Paper
        sx={{
          width: "100%",
          marginLeft: 1,
          marginRight: 1,
          display: "flex",
          border: (theme) => `1px solid ${theme.palette.divider}`,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <Grid item xs={5} justifyContent="center">
          <Stack alignItems="center" justifyContent="center">
            <Typography variant="body2" sx={{ marginTop: 1 }}>
              Selektering
            </Typography>
            <Switch />
          </Stack>
        </Grid>
        <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
        <Grid item xs={5} justifyContent="center">
          <Stack alignItems="center" justifyContent="center">
            <Typography variant="body2" sx={{ marginTop: 1 }}>
              Fastighetslager
            </Typography>
            <Switch />
          </Stack>
        </Grid>
      </Paper>
    </Grid>
  );
}

export default EstateToolbox;
