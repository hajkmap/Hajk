import React from "react";
import { Collapse, Box, IconButton, ListItemButton } from "@mui/material";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";

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
        className="FINDME111"
        disableTouchRipple
        onClick={() => setState({ expanded: !state.expanded })}
        sx={{
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
        <IconButton
          size="small"
          sx={{
            pl: "3px",
            pr: "4px",
            "&:hover": {
              backgroundColor: "transparent", // or same as default bg color
              boxShadow: "none",
            },
          }}
          disableTouchRipple
        >
          <KeyboardArrowRightOutlinedIcon
            className="ls-arrow"
            sx={{}}
          ></KeyboardArrowRightOutlinedIcon>
        </IconButton>
        <Box
          sx={{
            display: "flex",
            position: "relative",
            width: "100%",
            alignItems: "center",
            py: 0.25,
            pr: 1,
            borderBottom: (theme) =>
              `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
          }}
        >
          {toggleable && toggleDetails}
          {layerGroupTitle}
        </Box>
      </ListItemButton>
      <Collapse in={state.expanded} unmountOnExit>
        <Box sx={{ marginLeft: "26px" }}>{children}</Box>
      </Collapse>
    </div>
  );
}
