// Base
import React, { useState } from "react";
import { Divider, Grid, Typography } from "@mui/material";

import { ENVIRONMENT_IDS } from "plugins/VisionIntegration/constants";
import EnvironmentTypeSelector from "./EnvironmentTypeSelector";

function EnvironmentSection(props) {
  const [currentType, setCurrentType] = useState(ENVIRONMENT_IDS.AREA);

  const headerText =
    [].length > 0
      ? "Selekterade områden"
      : "Det finns inga selekterade områden";
  const helperText =
    [].length > 0
      ? ""
      : "Aktivera verktyget och klicka i kartan för att selektera områden.";

  const handleTypeSelectChange = (e) => {
    setCurrentType(e.target.value);
  };

  return (
    <Grid container sx={{ pl: 2, pr: 2, pt: 1, pb: 2 }}>
      <EnvironmentTypeSelector
        type={currentType}
        handleChange={handleTypeSelectChange}
      />
      <Grid
        container
        sx={{ marginTop: 2, marginBottom: 0.5 }}
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
    </Grid>
  );
}

export default EnvironmentSection;
