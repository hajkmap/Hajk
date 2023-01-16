// Base
import React from "react";
import { Divider, Grid } from "@mui/material";

import EnvironmentTypeSelector from "./EnvironmentTypeSelector";
import SelectionArea from "./SelectionArea";

function EnvironmentSection(props) {
  const handleTypeSelectChange = (e) => {
    props.setActiveType(e.target.value);
  };

  return (
    <Grid container sx={{ pl: 2, pr: 2, pt: 1, pb: 2 }}>
      <EnvironmentTypeSelector
        type={props.activeType}
        handleChange={handleTypeSelectChange}
      />
      <Grid
        container
        sx={{ marginTop: 2, marginBottom: 0.5 }}
        justifyContent="center"
      >
        <Divider sx={{ width: "20%" }} />
      </Grid>
      <SelectionArea
        app={props.app}
        source={props.source}
        mapViewModel={props.mapViewModel}
        model={props.model}
        typeId={props.activeType}
        selectedObjects={[]}
        setSelectedObjects={console.log}
      />
    </Grid>
  );
}

export default EnvironmentSection;
