import React, { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  alpha,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  SETTINGS_SEARCH_CLOSE,
  SETTINGS_SEARCH_OPEN,
  useSettingsSearchTerm,
} from "./settings-search";

interface FormAccordionProps {
  title: string;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
}

export default function FormAccordion({
  title,
  children,
  defaultExpanded = false,
}: FormAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const searching = useSettingsSearchTerm() !== null;
  const rootRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef(expanded);
  const openedBySearch = useRef(false);
  expandedRef.current = expanded;

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const open = () => {
      if (!expandedRef.current) openedBySearch.current = true;
      setExpanded(true);
    };
    const close = () => {
      if (!openedBySearch.current) return;
      openedBySearch.current = false;
      setExpanded(false);
    };
    node.addEventListener(SETTINGS_SEARCH_OPEN, open);
    node.addEventListener(SETTINGS_SEARCH_CLOSE, close);
    return () => {
      node.removeEventListener(SETTINGS_SEARCH_OPEN, open);
      node.removeEventListener(SETTINGS_SEARCH_CLOSE, close);
    };
  }, []);

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

  return (
    <Accordion
      ref={rootRef}
      disableGutters
      expanded={expanded}
      onChange={handleAccordionChange}
      {...(searching
        ? { "data-settings-section": "", "data-settings-title": title }
        : {})}
      sx={{
        width: "100%",
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
          component="div"
          sx={{
            width: "calc(100% - 20px)",
            maxWidth: "calc(100% - 20px)",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <Typography variant="h6" sx={{ flexShrink: 0, paddingRight: 2 }}>
            {title}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2 }}>{children}</AccordionDetails>
    </Accordion>
  );
}
