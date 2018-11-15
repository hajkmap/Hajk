import React from "react";
import { withStyles } from "@material-ui/core/styles";
import LoupeIcon from "@material-ui/icons/Loupe";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";

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
      <Tooltip title="Visa påverkan inom">
        <Button
          className={classes.button}
          variant={this.state.active ? "raised" : "text"}
          onClick={() => {
            this.setState(
              {
                active: !this.state.active
              },
              () => {
                this.props.model.toggleDraw(this.state.active, () => {
                  this.setState({
                    active: false
                  });
                });
              }
            );
          }}
        >
          <LoupeIcon />
          &nbsp; Markera i kartan
        </Button>
      </Tooltip>
    );
  }
}

export default withStyles(styles)(SearchWithinButton);
