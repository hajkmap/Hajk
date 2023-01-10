// Base
import React, { useState } from "react";
import { Grid } from "@mui/material";

import { ENVIRONMENT_IDS } from "plugins/VisionIntegration/constants";
import EnvironmentTypeSelector from "./EnvironmentTypeSelector";

function EnvironmentSection(props) {
  const [currentType, setCurrentType] = useState(ENVIRONMENT_IDS.AREA);

  const handleTypeSelectChange = (e) => {
    setCurrentType(e.target.value);
  };

  return (
    <Grid container sx={{ pl: 2, pr: 2, pt: 1, pb: 2 }}>
      <EnvironmentTypeSelector
        type={currentType}
        handleChange={handleTypeSelectChange}
      />
    </Grid>
  );
}

export default EnvironmentSection;
