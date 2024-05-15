import React from "react";
import { Typography } from "@mui/material";

import DigitalPlan from "./DigitalPlan.js";

function DigitalPlanList({ digitalPlanFeatures, options, userDetails }) {
  return Object.entries(digitalPlanFeatures).length > 0 ? (
    Object.entries(digitalPlanFeatures).map(([digitalPlanKey, plan], i) => (
      <DigitalPlan
        digitalPlanKey={digitalPlanKey}
        plan={plan}
        key={i}
        options={options}
        userDetails={userDetails}
      />
    ))
  ) : (
    <Typography sx={{ p: 2 }}>
      Inga digitala plan hittades på den klickade punkten. Observera att det
      fortfarande kan finnas en detaljplan på ytan och du ska kontrollera det
      genom att titta i lagret med detaljplaner.
    </Typography>
  );
}

export default DigitalPlanList;
