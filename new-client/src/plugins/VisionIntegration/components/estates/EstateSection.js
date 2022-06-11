// Base
import React from "react";
import { Divider, Grid, Typography } from "@mui/material";

// Components
import EstateToolbox from "./EstateToolbox";
import EstateListItem from "./EstateListItem";

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
      <Grid item xs={12}>
        {props.selectedEstates.map((estate) => {
          return (
            <EstateListItem
              key={estate.get("fnr_fr")}
              title={estate.get("fnr_fr")}
            />
          );
        })}
      </Grid>
    </Grid>
  );
}

export default EstateSection;
