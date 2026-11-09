import React from "react";
import propTypes from "prop-types";
import Button from "@mui/material/Button";
import BaseDialog from "./Dialog/BaseDialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import i18n from "src/i18n";

class AlertView extends React.PureComponent {
  state = {};

  static propTypes = {
    open: propTypes.bool.isRequired,
    parent: propTypes.object.isRequired,
  };

  handleClose = (_e) => {
    this.props.parent.setState({
      alert: false,
    });
  };

  render() {
    const {
      open,
      dialogTitle = i18n.t("alert.title"),
      message = i18n.t("alert.missingMessage"),
    } = this.props;
    return (
      <BaseDialog
        open={open}
        onClose={this.handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{dialogTitle}</DialogTitle>
        <DialogContent>{message}</DialogContent>
        <DialogActions>
          <Button onClick={this.handleClose} color="primary" autoFocus>
            {i18n.t("common.ok")}
          </Button>
        </DialogActions>
      </BaseDialog>
    );
  }
}

export default AlertView;
