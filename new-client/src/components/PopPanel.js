import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import PanelHeader from "./PanelHeader";

const withStylesProps = styles => Component => props => {
  var style = styles(props);
  const Comp = withStyles(style)(Component);
  return <Comp {...props} />;
};

const styles = props => {
  return {
    popPanel: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      background: "white",
      zIndex: 1200,
      order: 1,
      height: props.height,
      maxWidth: "400px",
      top: props.top,
      boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
      overflow: "hidden"
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

  state = {};

  componentDidMount() {}

  render() {
    const { classes, children, open, top } = this.props;
    var activeClasses = [classes.popPanel];
    if (!open) {
      activeClasses = [classes.hidden, activeClasses];
    }
    return (
      <div ref="panel" className={classNames(activeClasses)}>
        <PanelHeader title={this.props.title} onClose={this.close} />
        <div className={classes.body}>{children}</div>
      </div>
    );
  }
}

PopPanel.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStylesProps(styles)(PopPanel);
//export default withStyles(styles)(PopPanel);
