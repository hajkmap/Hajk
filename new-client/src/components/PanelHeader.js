import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  header: {
    padding: "10px",
    background: "#efefef",
    borderBottom: "1px solid #ccc",
    cursor: 'pointer',
    userSelect: 'none'
  },
  headerText: {
    marginBottom: 0
  }
});

class PanelHeader extends Component {
  renderHideAllLayersButton() {
    if (this.props.hideAllLayersButton === true) {
      return (
        <i className="material-icons" onClick={this.props.hideAllLayers}>
          visibility_off
        </i>
      );
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.header}>
        <div className="icons pull-right">
          {this.renderHideAllLayersButton()}
          <i className="material-icons">minimize</i>
          <i
            className="material-icons"
            onClick={this.props.onClose}
          >close</i>
        </div>
        <h2 className={classes.headerText}>{this.props.title}</h2>
      </div>
    );
  }
}

export default withStyles(styles)(PanelHeader);