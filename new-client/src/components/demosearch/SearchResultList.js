import React from "react";

import SearchResultGroup from "./SearchResultGroup";

import { makeStyles } from "@material-ui/core/styles";
import { Paper } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    backgroundColor: theme.palette.background.paper,
    position: "relative",
    overflow: "auto",
    maxHeight: 300
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular
  }
}));

const SearchResultList = props => {
  const classes = useStyles();

  return (
    <Paper id="searchResultList" className={classes.root}>
      <SearchResultGroup id="searchResultGroup" {...props} />
    </Paper>
  );
};

export default SearchResultList;
