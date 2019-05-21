import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import SearchIcon from "@material-ui/icons/Search";

const styles = theme => {
  return {
    button: {
      margin: "4px"
    },
    searchIcon: {
      color: "white"
    }
  };
};

class SearchWithinButton extends React.Component {
  state = {
    active: false
  };

  render() {
    const { classes } = this.props;
    return (
      <Button className={classes.button} onClick={this.props.onClick}>
        <SearchIcon color="primary" />
      </Button>
    );
  }
}

export default withStyles(styles)(SearchWithinButton);
