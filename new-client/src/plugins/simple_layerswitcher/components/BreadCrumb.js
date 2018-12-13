import React, { Component } from "react";
import CloseIcon from "@material-ui/icons/Close";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import { withStyles } from "@material-ui/core/styles";
import classnames from "classnames";

const styles = theme => ({
  breadCrumbFlat: {
    borderRadius: "0 !important",
    marginBottom: "5px !important"
  },
  breadCrumb: {
    [theme.breakpoints.down("xs")]: {
      background: "white",
      margin: "3px",
      display: "flex",
      justifyContent: "space-between",
      padding: "10px",
      border: "1px solid #ccc"
    },
    [theme.breakpoints.up("sm")]: {
      background: "white",
      borderTopLeftRadius: "5px",
      borderTopRightRadius: "5px",
      margin: "0px",
      marginLeft: "5px",
      display: "flex",
      justifyContent: "space-between",
      padding: "10px",
      border: "1px solid #ccc",
      whiteSpace: "nowrap"
    }
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

  isOverflow(el) {
    if (!el) return false;
    let original = el.scrollLeft++;
    let overflow = el.scrollLeft-- > original;
    return overflow;
  }

  render() {
    const { classes } = this.props;
    const { hidden } = this.state;
    var cls =
      this.props.type === "flat"
        ? classnames(classes.breadCrumb, classes.breadCrumbFlat)
        : classes.breadCrumb;
    return (
      <div className={cls} data-type="bread-crumb">
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
