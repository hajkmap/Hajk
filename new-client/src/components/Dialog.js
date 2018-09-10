import React, { Component } from "react";
import PropTypes from "prop-types";
import { Drawer } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import withMobileDialog from '@material-ui/core/withMobileDialog';

const styles = theme => {};

class MyDialog extends Component {

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
    }
  }

  handleClose = (e) => {
    this.props.onClose();
  };

  getHtml(text) {
    return {
      __html: text
    }
  }

  renderDialogContent(text) {
    return (
      <div dangerouslySetInnerHTML={this.getHtml(text)}></div>
    );
  }

  render() {

    const { fullScreen, options } = this.props;
    var text = "", header = "";
    if (options) {
      header = options.headerText;
      text = options.text;
    }

    return (
      <Dialog
        fullScreen={fullScreen}
        open={this.state.open}
        onClose={this.handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">{header}</DialogTitle>
        <DialogContent>
          {this.renderDialogContent(text)}
        </DialogContent>
        <DialogActions>
          <Button onClick={this.handleClose} color="primary" autoFocus>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

}

MyDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired,
  fullScreen: PropTypes.bool,
  open: PropTypes.bool.isRequired
};

export default withStyles(styles)(MyDialog);

