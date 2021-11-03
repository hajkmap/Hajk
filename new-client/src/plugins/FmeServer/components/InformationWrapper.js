import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid } from "@material-ui/core";

// The styling here is terrible, but since mui5 migration is around the
// corner i cba to do this properly. (With mui5 this will be done in 5 lines instead).
const useStyles = makeStyles((theme) => ({
  error: {
    background:
      theme.palette.type === "dark"
        ? theme.palette.error.dark
        : theme.palette.error.main,
    color: theme.palette.error.contrastText,
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
  },
  warning: {
    background:
      theme.palette.type === "dark"
        ? theme.palette.warning.dark
        : theme.palette.warning.main,
    color: "#fff",
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
  },
  info: {
    background:
      theme.palette.type === "dark"
        ? theme.palette.info.dark
        : theme.palette.info.main,
    color: "#fff",
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
  },
}));

// Wraps the children inside a Grid container with some error-styling.
// TODO: Rename to HighlightWrapper and pass type-prop? That way we could
// highlight bot error, warning, and success information.
const InformationWrapper = ({ children, type }) => {
  const classes = useStyles();

  return (
    <Grid
      container
      item
      xs={12}
      className={
        type === "error"
          ? classes.error
          : type === "warning"
          ? classes.warning
          : classes.info
      }
    >
      {children}
    </Grid>
  );
};

export default InformationWrapper;
