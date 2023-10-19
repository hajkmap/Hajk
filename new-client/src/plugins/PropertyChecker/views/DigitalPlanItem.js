import React, { useEffect, useId } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Checkbox,
  Icon,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { ExpandMore, CheckCircleOutline } from "@mui/icons-material";

const DigitalPlanItem = ({ feature }) => {
  return (
    <ListItem>
      <ListItemText>
        {feature.get("plan_beteckning")}
        {feature.get("bestammelsetyp")}
        {feature.get("label_text")}
        {feature.get("formulering")}
        {feature.get("plan_planstatus")}
        {feature.get("plan_statusdatum")}
      </ListItemText>
    </ListItem>
  );
};

export default DigitalPlanItem;
