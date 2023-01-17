// Base
import React from "react";
import { Divider, Grid } from "@mui/material";

import EnvironmentTypeSelector from "./EnvironmentTypeSelector";
import SelectionArea from "./SelectionArea";

function EnvironmentSection(props) {
  const handleTypeSelectChange = (e) => {
    props.setActiveType(e.target.value);
  };

  // Workaround to mimic react setState... If we're provided a function it is probably used
  // to filter the previous value. If no function is supplied, we update right away.
  const setSelectedFeatures = (f) => {
    if (typeof f === "function") {
      const filteredFeatures = f(
        props.environmentState[props.activeType].selectedFeatures
      );
      props.setEnvironmentState((prev) => ({
        ...prev,
        [props.activeType]: {
          ...props.environmentState[props.activeType],
          selectedFeatures: filteredFeatures,
        },
      }));
    } else {
      props.setEnvironmentState((prev) => ({
        ...prev,
        [props.activeType]: {
          ...props.environmentState[props.activeType],
          selectedFeatures: f,
        },
      }));
    }
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
        selectedFeatures={
          props.environmentState[props.activeType].selectedFeatures
        }
        setSelectedFeatures={setSelectedFeatures}
      />
    </Grid>
  );
}

export default EnvironmentSection;
