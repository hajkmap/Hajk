import React, { Component } from "react";
import Input from "@material-ui/core/Input";
import { withStyles } from "@material-ui/core/styles";
import { fade } from "@material-ui/core/styles/colorManipulator";
import SearchIcon from "@material-ui/icons/Search";

const styles = theme => ({
  search: {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: fade(theme.palette.common.white, 0.25)
    }
  },
  searchIcon: {
    width: theme.spacing.unit * 9,
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  inputRoot: {
    color: "inherit",
    width: "100%"
  },
  inputInput: {
    paddingTop: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 10,
    transition: theme.transitions.create("width"),
    left: "100%",
    [theme.breakpoints.up("sm")]: {
      width: 200,
      "&:focus": {
        width: 200
      }
    }
  }
});

class SearchBar extends Component {
  render() {
    const { classes, onChange, onComplete } = this.props;
    return (
      <div className={classes.search}>
        <div className={classes.searchIcon}>
          <SearchIcon />
        </div>
        <Input
          autoComplete="off"
          onChange={e => {
            onChange(e.target.value, data => {
              onComplete(data);
            });
          }}
          placeholder="Sök…"
          disableUnderline
          classes={{
            root: classes.inputRoot,
            input: classes.inputInput
          }}
        />
      </div>
    );
  }
}

export default withStyles(styles)(SearchBar);
