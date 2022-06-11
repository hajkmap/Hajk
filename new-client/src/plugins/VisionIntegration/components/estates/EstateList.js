import React from "react";
import { Grid } from "@mui/material";
import EstateListItem from "./EstateListItem";

function EstateList(props) {
  return (
    <Grid item xs={12} sx={{ maxHeight: "250px", overflowY: "auto" }}>
      {props.selectedEstates.map((estate, index) => {
        return (
          <EstateListItem
            app={props.app}
            key={index}
            estate={estate}
            source={props.source}
            setSelectedEstates={props.setSelectedEstates}
          />
        );
      })}
    </Grid>
  );
}

export default EstateList;
