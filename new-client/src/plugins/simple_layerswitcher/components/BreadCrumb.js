import React, { Component } from "react";
import CloseIcon from "@material-ui/icons/Close";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  breadCrumb: {
    background: "white",
    margin: "3px",
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    border: "1px solid #ccc"
  },
  part: {
    margin: "0 5px",
    display: "flex"
  },
  icon: {
    cursor: "pointer"
  }
});

class BreadCrumb extends Component {
  constructor() {
    super();
    this.state = { hidden: false };
  }

  setLayerOpacity = layer => event => {
    this.setState(
      {
        hidden: !this.state.hidden
      },
      () => {
        layer.setOpacity(this.state.hidden ? 0 : 1);
      }
    );
  };

  setLayerVisibility = layer => event => {
    if (layer.get("visible")) {
      layer.setOpacity(1);
    }
    layer.set("visible", !layer.get("visible"));
  };

  render() {
    const { classes } = this.props;
    const { hidden } = this.state;
    return (
      <div className={classes.breadCrumb}>
        <div className={classes.part}>
          <div className={classes.part}>
            {!hidden ? (
              <VisibilityIcon
                className={classes.icon}
                onClick={this.setLayerOpacity(this.props.layer)}
              />
            ) : (
              <VisibilityOffIcon
                className={classes.icon}
                onClick={this.setLayerOpacity(this.props.layer)}
              />
            )}
          </div>
          <div className={classes.part}>{this.props.title}</div>
        </div>
        <div className={classes.part}>
          <CloseIcon
            className={classes.icon}
            onClick={this.setLayerVisibility(this.props.layer)}
          />
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(BreadCrumb);
