import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";

const styles = theme => {
  return {
    button: {
      margin: "4px"
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
      <Button className={classes.button} onClick={this.props.onClear}>
        Rensa sökning
      </Button>
    );
  }
}

export default withStyles(styles)(SearchWithinButton);
