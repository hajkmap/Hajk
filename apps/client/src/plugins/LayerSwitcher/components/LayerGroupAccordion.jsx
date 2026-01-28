import React, { useState, useEffect } from "react";
import { Collapse, Box, ListItemButton } from "@mui/material";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";
import LsIconButton from "./LsIconButton";

export default function LayerGroupAccordion({
  expanded,
  toggleable,
  children,
  layerGroupTitle,
  toggleDetails,
  display,
  isFirstGroup,
  isFirstChild,
  disableAccordion,
}) {
  const [state, setState] = useState({ expanded: expanded });

  useEffect(() => {
    setState({ expanded: expanded });
  }, [expanded]);

  //Ensures that each accordion, especially the first group and first child, responds to the intro step by forcing open expanded state
  useEffect(() => {
    const handler = () => {
      if (isFirstGroup) {
        setState({ expanded: true });
      }
      if (isFirstChild) {
        setState({ expanded: true });
      }
    };
    document.addEventListener("expandFirstGroup", handler);
    return () => document.removeEventListener("expandFirstGroup", handler);
  }, [isFirstGroup, isFirstChild]);

  return (
    <div style={{ display: display }}>
      <ListItemButton
        disableTouchRipple
        onClick={
          disableAccordion
            ? undefined
            : () => setState({ expanded: !state.expanded })
        }
        sx={(theme) => ({
          alignItems: "flex-start",
          borderBottom: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
          p: 0,
          pl: "2px",
          "& .ls-arrow": {
            transform: state.expanded ? "rotate(90deg)" : "",
            transition: "transform 300ms ease",
          },
          "&:hover .ls-arrow": {
            transform: state.expanded
              ? "rotate(90deg) translateX(-3px)"
              : "translateX(3px)",
          },
        })}
        dense
      >
        {!disableAccordion && (
          <LsIconButton
            id="layerGroup-accordion-arrow-button"
            data-first={isFirstGroup ? "true" : "false"}
            data-expanded={state.expanded}
            size="small"
            sx={{
              mt: "2px",
              pl: "3px",
              pr: "4px",
              "&:hover": {
                backgroundColor: "transparent",
                boxShadow: "none",
              },
            }}
          >
            <KeyboardArrowRightOutlinedIcon className="ls-arrow"></KeyboardArrowRightOutlinedIcon>
          </LsIconButton>
        )}
        <Box
          sx={{
            display: "flex",
            position: "relative",
            width: "100%",
            alignItems: "flex-start",
            py: 0.25,
            pr: 1,
          }}
        >
          {toggleable && toggleDetails}
          {layerGroupTitle}
        </Box>
      </ListItemButton>
      {disableAccordion ? (
        <Box
          sx={{
            marginLeft: "20px" /* jesade-vbg compact mode, changed from 26px */,
          }}
        >
          {children}
        </Box>
      ) : (
        <Collapse in={state.expanded} unmountOnExit>
          <Box
            sx={{
              marginLeft: "20px",
            }}
          >
            {children}
          </Box>
        </Collapse>
      )}
    </div>
  );
}
