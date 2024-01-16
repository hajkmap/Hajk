import React from "react";

import DigitalPlan from "./DigitalPlan.js";

function DigitalPlanList({ digitalPlanFeatures, options, userDetails }) {
  return Object.entries(digitalPlanFeatures).map(
    ([digitalPlanKey, plan], i) => (
      <DigitalPlan
        digitalPlanKey={digitalPlanKey}
        plan={plan}
        key={i}
        options={options}
        userDetails={userDetails}
      />
    )
  );
}

export default DigitalPlanList;
