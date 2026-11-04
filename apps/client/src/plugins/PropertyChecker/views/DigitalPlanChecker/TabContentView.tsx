import { Typography } from "@mui/material";

import DigitalPlan from "./DigitalPlan";
import i18n from "src/i18n";

import type { DigitalPlanCheckerTabContentViewProps } from "../../types";

function DigitalPlanList({
  digitalPlanFeatures,
  options,
  userDetails,
}: DigitalPlanCheckerTabContentViewProps) {
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
      {i18n.t("propertyChecker.noDigitalPlans")}
    </Typography>
  );
}

export default DigitalPlanList;
