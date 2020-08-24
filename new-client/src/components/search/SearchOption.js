import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import SortIcon from "@material-ui/icons/Sort";
import FilterListIcon from "@material-ui/icons/FilterList";

const useStyles = makeStyles((theme) => ({
  root: {
    "& > *": {
      margin: theme.spacing(1),
    },
  },
}));

const SearchOption = (props) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Button variant="contained" color="primary">
        <SortIcon />
        Sortera
      </Button>
      <Button variant="contained" color="primary">
        <FilterListIcon />
        Filtrera
      </Button>
    </div>
  );
};

export default SearchOption;
