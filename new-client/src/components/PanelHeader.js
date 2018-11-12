import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";

const styles = theme => ({
  header: {
    padding: "10px",
    background: "#efefef",
    borderBottom: "1px solid #ccc",
    userSelect: "none",
    margin: 0
  },
  icon: {
    cursor: "pointer",
    float: "right"
  }
});

class PanelHeader extends Component {
  render() {
    const { classes } = this.props;
    return (
      <h2 className={classes.header}>
        {this.props.title}
        <CloseIcon onClick={this.props.onClose} className={classes.icon} />
      </h2>
    );
  }
}

export default withStyles(styles)(PanelHeader);
