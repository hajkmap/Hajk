// Base
import React from "react";
import { Divider, Grid, Typography } from "@mui/material";

// Components
import EstateToolbox from "./EstateToolbox";
import EstateList from "./EstateList";

// Constants
import { ESTATE_TEXT } from "../../constants";

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
      <EstateToolbox />
      <Grid
        container
        sx={{ marginTop: 2, marginBottom: 1 }}
        justifyContent="center"
      >
        <Divider sx={{ width: "20%" }} />
      </Grid>
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
      <EstateList
        source={props.source}
        selectedEstates={props.selectedEstates}
        setSelectedEstates={props.setSelectedEstates}
      />
    </Grid>
  );
}

export default EstateSection;
