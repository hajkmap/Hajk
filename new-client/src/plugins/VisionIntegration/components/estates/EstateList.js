import React from "react";
import { Grid } from "@mui/material";
import EstateListItem from "./EstateListItem";

function EstateList(props) {
  return (
    <Grid item xs={12} sx={{ maxHeight: "250px", overflowY: "auto" }}>
      {props.selectedEstates.map((estate, index) => {
        return (
          <EstateListItem key={index} estate={estate} source={props.source} />
        );
      })}
    </Grid>
  );
}

export default EstateList;
