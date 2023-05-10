import React from "react";
import { Box, Fab } from "@mui/material";
import NavigationIcon from "@mui/icons-material/Navigation";
import { darken } from "@mui/material/styles";
import { visuallyHidden } from "@mui/utils";

const ScrollToTop = (props) => {
  return (
    // Pass on all props to the styled component
    <Fab
      size="small"
      onClick={props.onClick}
      sx={{
        position: "fixed",
        bottom: (theme) => theme.spacing(2),
        right: (theme) => theme.spacing(3),
        ...(props.color && {
          backgroundColor: props.color,
          "&:hover": {
            backgroundColor: darken(props.color, 0.3),
          },
        }),
      }}
    >
      <Box sx={visuallyHidden}>Scrolla till toppen av dokumentet</Box>
      <NavigationIcon />
    </Fab>
  );
};

export default ScrollToTop;
