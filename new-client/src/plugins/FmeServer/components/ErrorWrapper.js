import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    background:
      theme.palette.type === "dark"
        ? theme.palette.error.dark
        : theme.palette.error.main,
    color: theme.palette.error.contrastText,
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
  },
}));

// Wraps the children inside a Grid container with some error-styling.
// TODO: Rename to HighlightWrapper and pass type-prop? That way we could
// highlight bot error, warning, and success information.
const ErrorWrapper = ({ children }) => {
  const classes = useStyles();

  return (
    <Grid container item xs={12} className={classes.root}>
      {children}
    </Grid>
  );
};

export default ErrorWrapper;
