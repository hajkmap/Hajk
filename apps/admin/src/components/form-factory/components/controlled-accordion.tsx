import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface ControlledAccordionProps {
  title: string;
  triggerExpanded?: boolean;
  children: React.ReactNode;
  backgroundColor?: string;
}

function ControlledAccordion({
  title,
  triggerExpanded = false,
  children,
  backgroundColor,
}: ControlledAccordionProps) {
  // triggerExpanded is used in the ControlledAccordion to programmatically
  // control whether the accordion is expanded or collapsed. When triggerExpanded
  // is set to true, the accordion expands, and when set to false, it collapses.
  // This allows external components to trigger changes to the accordion's expansion state.

  const [expanded, setExpanded] = useState(triggerExpanded);

  useEffect(() => {
    setExpanded(triggerExpanded);
  }, [triggerExpanded]);

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

  return (
    <Accordion
      disableGutters
      expanded={expanded}
      onChange={handleAccordionChange}
      sx={{
        width: "100%",
        ml: 2,
        marginBottom: "24px !important",
        backgroundColor: backgroundColor ?? "none",
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pl: 0, pb: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

export default ControlledAccordion;
