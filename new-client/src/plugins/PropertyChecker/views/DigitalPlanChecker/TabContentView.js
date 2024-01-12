import React from "react";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  List,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import DigitalPlanItem from "./DigitalPlanItem.js";

function DigitalPlanList({ digitalPlanFeatures }) {
  return Object.entries(digitalPlanFeatures).map(
    ([digitalPlanKey, plan], i) => {
      console.log("digitalPlanKey, plan: ", digitalPlanKey, plan);
      return (
        <Accordion key={i} disableGutters defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="button">{digitalPlanKey}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {Object.entries(plan.features).map(([typeKey, type], j) => (
              <React.Fragment key={j}>
                <Typography variant="h6">{typeKey}</Typography>
                <List>
                  {type
                    .sort((a, b) =>
                      a.get("label_text").localeCompare(b.get("label_text"))
                    )
                    .map((f, index) => (
                      <DigitalPlanItem feature={f} key={index} />
                    ))}
                </List>
              </React.Fragment>
            ))}
          </AccordionDetails>
        </Accordion>
      );
    }
  );
}

export default DigitalPlanList;
