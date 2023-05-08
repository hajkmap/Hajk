import React from "react";
import {
  Collapse,
  ListItemSecondaryAction,
  Box,
  ListItemText,
  IconButton,
  ListItemButton,
} from "@mui/material";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";

export default function LayerGroupAccordion({
  expanded,
  toggleable,
  children,
  toggleDetails,
  name,
  layerGroupDetails,
  quickAccess,
}) {
  const [state, setState] = React.useState({ expanded: expanded });

  React.useEffect(() => {
    setState({ expanded: expanded });
  }, [expanded]);

  const updateCustomProp = (prop, value) => {
    setState((prevState) => ({ ...prevState, [prop]: value }));
  };

  return (
    <>
      <ListItemButton
        disableRipple
        onClick={() => updateCustomProp("expanded", !state.expanded)}
        sx={{
          px: 1,
          borderBottom: (theme) =>
            `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
        }}
        dense
      >
        <IconButton
          size="small"
          sx={{ pr: !toggleable && !quickAccess ? "5px" : 0 }}
          disableRipple
        >
          <KeyboardArrowRightOutlinedIcon
            sx={{
              transform: state.expanded ? "rotate(90deg)" : "",
              transition: "transform 300ms ease",
            }}
          ></KeyboardArrowRightOutlinedIcon>
        </IconButton>
        {toggleable && toggleDetails}
        {quickAccess && quickAccess}
        <ListItemText primary={name} />
        {layerGroupDetails && (
          <ListItemSecondaryAction>{layerGroupDetails}</ListItemSecondaryAction>
        )}
      </ListItemButton>
      <Collapse in={state.expanded}>
        <Box sx={{ marginLeft: "40px" }}>{children}</Box>
      </Collapse>
    </>
  );
}
