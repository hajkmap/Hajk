import React from "react";
import propTypes from "prop-types";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";

class AlertView extends React.PureComponent {
  state = {};

  static propTypes = {
    open: propTypes.bool.isRequired,
    parent: propTypes.object.isRequired,
  };

  handleClose = (e) => {
    this.props.parent.setState({
      alert: false,
    });
  };

  render() {
    const {
      open,
      dialogTitle = "Meddelande",
      message = "Meddelande saknas",
    } = this.props;
    return (
      <Dialog
        open={open}
        onClose={this.handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{dialogTitle}</DialogTitle>
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

export default AlertView;
