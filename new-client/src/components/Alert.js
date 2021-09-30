import React from "react";
import propTypes from "prop-types";
import withStyles from "@mui/styles/withStyles";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";

const styles = (theme) => {
  return {};
};

class AlertView extends React.PureComponent {
  state = {};

  static propTypes = {
    classes: propTypes.object.isRequired,
    message: propTypes.any.isRequired,
    open: propTypes.bool.isRequired,
    parent: propTypes.object.isRequired,
    title: propTypes.string.isRequired,
  };

  static defaultProps = {
    message: "Meddelande saknas",
    title: "Titel saknas",
  };

  handleClose = (e) => {
    this.props.parent.setState({
      alert: false,
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
