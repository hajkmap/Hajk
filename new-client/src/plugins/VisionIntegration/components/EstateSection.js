// Base
import React from "react";
import { Grid, Typography } from "@mui/material";

// Constants
import { ESTATE_TEXT } from "../constants";

function EstateSection(props) {
  const headerText =
    props.selectedEstates.length === 0
      ? ESTATE_TEXT.NO_SELECTED_ESTATES_HEADER
      : ESTATE_TEXT.SELECTED_ESTATES_HEADER;
  const helperText =
    props.selectedEstates.length === 0
      ? ESTATE_TEXT.NO_SELECTED_ESTATES_HELP
      : "";
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
      <Grid item xs={12}>
        {props.selectedEstates.map((estate) => {
          return (
            <Grid container item xs={12} key={estate.getId()}>
              {estate.get("fnr_fr")}
            </Grid>
          );
        })}
      </Grid>
    </Grid>
  );
}

export default EstateSection;
