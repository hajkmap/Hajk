import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";

const styles = theme => ({
  header: {
    padding: "10px",
    background: "#efefef",
    borderBottom: "1px solid #ccc",
    userSelect: "none"
  },
  headerText: {
    marginBottom: 0
  },
  icon: {
    cursor: "pointer"
  }
});

class PanelHeader extends Component {
  render() {
    const { classes } = this.props;
    return (
      <div className={classes.header}>
        <div className="icons pull-right">
          <CloseIcon onClick={this.props.onClose} className={classes.icon} />
        </div>
        <h2 className={classes.headerText}>{this.props.title}</h2>
      </div>
    );
  }
}

export default withStyles(styles)(PanelHeader);
