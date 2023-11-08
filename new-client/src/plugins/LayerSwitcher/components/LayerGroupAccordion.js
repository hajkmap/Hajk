import React from "react";
import {
  Collapse,
  ListItemSecondaryAction,
  Box,
  IconButton,
  ListItemButton,
} from "@mui/material";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";

export default function LayerGroupAccordion({
  expanded,
  toggleable,
  children,
  layerGroupTitle,
  toggleDetails,
  layerGroupDetails,
  quickAccess,
  display,
}) {
  const [state, setState] = React.useState({ expanded: expanded });

  React.useEffect(() => {
    setState({ expanded: expanded });
  }, [expanded]);

  const updateCustomProp = (prop, value) => {
    setState((prevState) => ({ ...prevState, [prop]: value }));
  };

  return (
    <div style={{ display: display }}>
      <ListItemButton
        disableRipple
        onClick={() => updateCustomProp("expanded", !state.expanded)}
        sx={{
          p: 0,
        }}
        dense
      >
        <IconButton
          size="small"
          sx={{ pl: "3px", pr: "4px", py: 0 }}
          disableRipple
        >
          <KeyboardArrowRightOutlinedIcon
            sx={{
              transform: state.expanded ? "rotate(90deg)" : "",
              transition: "transform 300ms ease",
            }}
          ></KeyboardArrowRightOutlinedIcon>
        </IconButton>
        <Box
          sx={{
            display: "flex",
            position: "relative",
            width: "100%",
            alignItems: "center",
            py: 0.5,
            pr: 1,
            borderBottom: (theme) =>
              quickAccess && !state.expanded
                ? `${theme.spacing(0.2)} solid transparent`
                : `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
          }}
        >
          {toggleable && toggleDetails}
          {quickAccess && quickAccess}
          {layerGroupTitle}
          {layerGroupDetails && (
            <ListItemSecondaryAction>
              {layerGroupDetails}
            </ListItemSecondaryAction>
          )}
        </Box>
      </ListItemButton>
      <Collapse in={state.expanded}>
        <Box sx={{ marginLeft: "26px" }}>{children}</Box>
      </Collapse>
    </div>
  );
}
