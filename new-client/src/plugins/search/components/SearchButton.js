import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";

const styles = theme => ({
  searchButton: {
    borderRadius: 0
  }
});

class SearchButton extends Component {
  render() {
    const { classes, onClick } = this.props;
    return (
      <IconButton onClick={onClick} className={classes.searchButton}>
        <SearchIcon />
      </IconButton>
    );
  }
}

export default withStyles(styles)(SearchButton);
