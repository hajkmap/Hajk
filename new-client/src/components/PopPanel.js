import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Popper from "@material-ui/core/Popper";
import Paper from "@material-ui/core/Paper";
import PanelHeader from "./PanelHeader";

const styles = theme => {
  return {
    popper: {
      zIndex: 4
    },
    content: {
      maxWidth: "400px",
      background: "white"
    },
    hidden: {
      display: "none"
    },
    body: {
      padding: "15px",
      overflow: "auto"
    }
  };
};

class PopPanel extends Component {
  close = e => {
    const { onClose } = this.props;
    if (onClose) onClose();
  };

  state = {
    panelPosition: false,
    placement: "right-start"
  };

  componentDidMount() {
    if (this.props.globalObserver) {
      this.props.globalObserver.subscribe("toolbarExpanded", open => {
        this.setState(
          {
            placement: "right"
          },
          () => {
            this.setState({
              placement: "right-start"
            });
          }
        );
      });
    }
  }

  render() {
    var { classes, children, anchorEl, open } = this.props;
    const { placement } = this.state;
    if (open === undefined) {
      open = false;
    }
    const id = open ? "no-transition-popper" : null;
    return (
      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement={placement}
        className={classes.popper}
      >
        <Paper className={classes.content}>
          <PanelHeader
            title={this.props.title}
            onClose={this.close}
            maximizable={false}
            onMaximize={() => {}}
            onMinimize={() => {}}
          />
          <div className={classes.body}>{children}</div>
        </Paper>
      </Popper>
    );
  }
}

PopPanel.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(PopPanel);
