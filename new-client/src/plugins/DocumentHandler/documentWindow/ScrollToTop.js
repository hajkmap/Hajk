import React from "react";
import { Box, Fab } from "@mui/material";
import NavigationIcon from "@mui/icons-material/Navigation";
import { darken } from "@mui/material/styles";
import { visuallyHidden } from "@mui/utils";
import { styled } from "@mui/material/styles";

const FabScrollToTopButton = styled(Fab)(({ color, theme }) => {
  return {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(3),
    ...(color && {
      backgroundColor: color,
      "&:hover": {
        backgroundColor: darken(color, 0.3),
      },
    }),
  };
});

const ScrollToTop = (props) => {
  return (
    // Pass on all props to the styled component
    <FabScrollToTopButton size="small" {...props}>
      <Box sx={visuallyHidden}>Scrolla till toppen av dokumentet</Box>
      <NavigationIcon />
    </FabScrollToTopButton>
  );
};

export default ScrollToTop;
