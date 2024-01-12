import React from "react";

import { List } from "@mui/material";

import DigitalPlanItem from "./DigitalPlanItem.js";

function DigitalPlanList({ digitalPlanFeatures }) {
  return (
    <List>
      {digitalPlanFeatures.map((f, j) => {
        return <DigitalPlanItem feature={f} key={j} />;
      })}
    </List>
  );
}

export default DigitalPlanList;
