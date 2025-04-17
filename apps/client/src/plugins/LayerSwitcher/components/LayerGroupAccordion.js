import React from "react";
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
}) {
  const [state, setState] = React.useState({ expanded: expanded });

  React.useEffect(() => {
    setState({ expanded: expanded });
  }, [expanded]);

  return (
    <div style={{ display: display }}>
      <ListItemButton
        disableTouchRipple
        onClick={() => setState({ expanded: !state.expanded })}
        sx={{
          alignItems: "flex-start",
          borderBottom: (theme) =>
            `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
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
        }}
        dense
      >
        <LsIconButton
          size="small"
          sx={{
            mt: "2px",
            pl: "3px",
            pr: "4px",
            "&:hover": {
              backgroundColor: "transparent", // or same as default bg color
              boxShadow: "none",
            },
          }}
        >
          <KeyboardArrowRightOutlinedIcon className="ls-arrow"></KeyboardArrowRightOutlinedIcon>
        </LsIconButton>
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
      <Collapse in={state.expanded} unmountOnExit>
        <Box
          sx={{
            marginLeft: "20px" /* jesade-vbg compact mode, changed from 26px */,
          }}
        >
          {children}
        </Box>
      </Collapse>
    </div>
  );
}
