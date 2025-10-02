import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  alpha,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface FormAccordionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export default function FormAccordion({
  title,
  children,
  defaultExpanded = false,
}: FormAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

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
        backgroundColor: "none",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={(theme) => ({
          transition: "border-bottom 250ms ease-in-out",
          borderBottom: expanded
            ? `1px solid ${theme.palette.divider}`
            : `1px solid ${alpha(theme.palette.divider, 0.0)}`,
        })}
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
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pl: 0, pb: 0, pt: "1.5rem" }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
