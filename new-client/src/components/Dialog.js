import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";

const styles = theme => ({
  closed: {
    display: "none"
  },
  blanket: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 10000
  },
  content: {
    maxHeight: "500px",
    overflow: "auto"
  },
  bottom: {},
  dialog: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "20px",
    margin: "20%",
    [theme.breakpoints.down("xs")]: {
      margin: "20px"
    }
  }
});

class Dialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  /*
   * If the lifecycle of the component is not controlled by itself
   * the render method can be used to make the component
   * update its state when props changes.
   *
   * It is not recommended to mutate the state of this component
   * if the keys have the same name, it will duplicate the update event and
   * the last prop value will be taken.
   *
   * NOTE: this method is considered safer than using legacy componentWillRecieveProps.
   *
   * @param {object} props - new props
   * @param {object} state - current state
   * @return {object} state - updated state
   */
  static getDerivedStateFromProps(props, state) {
    return {
      open: props.open
    };
  }

  handleClose = e => {
    e.stopPropagation();
    this.props.onClose();
  };

  handleDialogClick = e => {
    e.stopPropagation();
    return false;
  };

  getHtml(text) {
    return {
      __html: text
    };
  }

  renderDialogContent(text) {
    return <div dangerouslySetInnerHTML={this.getHtml(text)} />;
  }

  render() {
    const { options, classes } = this.props;
    var text = "",
      header = "";
    if (options) {
      header = options.headerText;
      text = options.text;
    }

    var blanketClass = this.state.open ? classes.blanket : classes.closed;

    return (
      <div className={blanketClass} onClick={this.handleClose}>
        <div className={classes.dialog} onClick={this.handleDialogClick}>
          <div className={classes.content}>
            <h3>{header}</h3>
            {this.renderDialogContent(text)}
          </div>
          <div className={classes.bottom}>
            <Button onClick={this.handleClose} color="primary" autoFocus>
              Ok
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

Dialog.propTypes = {
  classes: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired
};

export default withStyles(styles)(Dialog);
