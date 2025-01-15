import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface ControlledAccordionProps {
  title: string;
  values: string;
  triggerExpanded?: boolean;
  children: React.ReactNode;
  backgroundColor?: string;
}

function ControlledAccordion({
  title,
  values,
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

  const controlledAccordion = () => {
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
        <AccordionSummary
          sx={{ maxWidth: "100%" }}
          expandIcon={<ExpandMoreIcon />}
        >
          <Box
            sx={{ width: "calc(100% - 20px)", maxWidth: "calc(100% - 20px)" }}
            display="flex"
            alignItems="center"
            overflow="hidden"
          >
            <Typography variant="h6" sx={{ flexShrink: 0, paddingRight: 2 }}>
              {title}
            </Typography>
            {!expanded && (
              <Typography
                variant="caption"
                noWrap
                sx={{
                  flexGrow: 1,
                  textAlign: "right",
                }}
              >
                <Box
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    width: "100%",
                    maxWidth: "100%",
                    opacity: 0.7,
                  }}
                >
                  {values && values.length > 0 ? `(${values})` : ""}
                </Box>
              </Typography>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pl: 0, pb: 0 }}>{children}</AccordionDetails>
      </Accordion>
    );
  };

  return controlledAccordion();
}

export default ControlledAccordion;
