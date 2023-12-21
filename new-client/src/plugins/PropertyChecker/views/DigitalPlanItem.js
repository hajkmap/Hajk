import React from "react";
import { ListItem, ListItemText } from "@mui/material";

const DigitalPlanItem = ({ feature }) => {
  return (
    <ListItem>
      <ListItemText
        primary={feature.get("label_text")}
        secondary={feature.get("formulering")}
      />
      {/* {feature.get("plan_beteckning")}
        {feature.get("bestammelsetyp")}
        {feature.get("label_text")}
        {feature.get("formulering")}
        {feature.get("plan_planstatus")}
        {feature.get("plan_statusdatum")} */}
    </ListItem>
  );
};

export default DigitalPlanItem;
