import React from "react";
import propTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";

const styles = theme => {
  return {};
};

class AlertView extends React.PureComponent {
  state = {};

  static propTypes = {
    classes: propTypes.object.isRequired,
    message: propTypes.any.isRequired,
    open: propTypes.bool.isRequired,
    parent: propTypes.object.isRequired,
    title: propTypes.string.isRequired
  };

  static defaultProps = {
    message: "Meddelande saknas",
    title: "Titel saknas"
  };

  handleClose = e => {
    this.props.parent.setState({
      alert: false
    });
  };

  render() {
    const { open, dialogTitle, message } = this.props;
    return (
      <Dialog
        open={open}
        onClose={this.handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {dialogTitle || "Meddelande"}
        </DialogTitle>
        <DialogContent>{message}</DialogContent>
        <DialogActions>
          <Button onClick={this.handleClose} color="primary" autoFocus>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default withStyles(styles)(AlertView);
