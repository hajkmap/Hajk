import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";

import ReactDialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

const styles = theme => ({});

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
    return <span dangerouslySetInnerHTML={this.getHtml(text)} />;
  }

  render() {
    const { options } = this.props;
    var text = "",
      header = "";

    if (options) {
      header = options.headerText;
      text = options.text;
    }

    var fullScreen = document.body.clientWidth < 600;

    return (
      <ReactDialog
        fullScreen={fullScreen}
        open={this.state.open}
        onClose={this.handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">{header}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {this.renderDialogContent(text)}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClose} color="primary" autoFocus>
            Stäng
          </Button>
        </DialogActions>
      </ReactDialog>
    );
  }
}

Dialog.propTypes = {
  options: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired
};

export default withStyles(styles)(Dialog);
