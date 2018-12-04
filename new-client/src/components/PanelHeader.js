import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";

const styles = theme => {
  return {
    header: {
      padding: "11px",
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderBottom: "1px solid #ccc",
      userSelect: "none",
      margin: 0,
      fontSize: "14pt"
    },
    icon: {
      cursor: "pointer",
      float: "right"
    }
  };
};

class PanelHeader extends Component {
  render() {
    const { classes } = this.props;
    return (
      <div className={classes.header}>
        {this.props.title}
        <CloseIcon onClick={this.props.onClose} className={classes.icon} />
      </div>
    );
  }
}

export default withStyles(styles)(PanelHeader);
