// Base
import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from "@mui/material";

const StyledAccordionSummary = styled(AccordionSummary)(() => ({
  minHeight: 35,
  "&.MuiAccordionSummary-root.Mui-expanded": {
    minHeight: 35,
  },
  "& .MuiAccordionSummary-content": {
    transition: "inherit !important",
    marginTop: 0,
    marginBottom: 0,
    "&.Mui-expanded": {
      marginTop: 0,
      marginBottom: 0,
    },
  },
}));

function EstateListItem(props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Accordion
      expanded={expanded}
      TransitionProps={{
        timeout: 0,
      }}
      onChange={() => setExpanded(!expanded)}
    >
      <StyledAccordionSummary>{props.title}</StyledAccordionSummary>
    </Accordion>
  );
}

export default EstateListItem;
