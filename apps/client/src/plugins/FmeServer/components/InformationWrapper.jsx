import React from "react";
import { Grid } from "@mui/material";
import { styled } from "@mui/material/styles";

// The styling here is terrible, but since mui5 migration is around the
// corner i cba to do this properly. (With mui5 this will be done in 5 lines instead).
const StyledGrid = styled(Grid)(({ type, theme }) => ({
  background:
    type === "error"
      ? theme.palette.mode === "dark"
        ? theme.palette.error.dark
        : theme.palette.error.main
      : type === "warning"
        ? theme.palette.mode === "dark"
          ? theme.palette.warning.dark
          : theme.palette.warning.main
        : theme.palette.mode === "dark"
          ? theme.palette.info.dark
          : theme.palette.info.main,
  color: theme.palette.error.contrastText,
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
}));

// Wraps the children inside a Grid container with some styling.
// Supports "error", "warning", and "info". Default to "info".
const InformationWrapper = ({ children, type }) => {
  return (
    <StyledGrid container item xs={12} type={type}>
      {children}
    </StyledGrid>
  );
};

export default InformationWrapper;
