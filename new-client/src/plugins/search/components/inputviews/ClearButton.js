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

class ClearButton extends React.PureComponent {
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

export default withStyles(styles)(ClearButton);
