import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { ColorButtonGreen, ColorButtonRed } from "./custombuttons";

const styles = () => ({});

class WarningModal extends React.Component {
  render = () => {
    const { open } = this.props;

    const { handleCancelClick, handleApproveClick } = this.props;
    return (
      <Dialog
        open={open}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Ta bort menylänk"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Menylänken och eventuella undermenyer kommer tas bort, vill du
            fortsätta?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <ColorButtonGreen
            variant="contained"
            className="btn"
            onClick={handleApproveClick}
          >
            <Typography variant="button">Ja</Typography>
          </ColorButtonGreen>
          <ColorButtonRed
            variant="contained"
            className="btn"
            onClick={handleCancelClick}
          >
            <Typography variant="button">Nej</Typography>
          </ColorButtonRed>
        </DialogActions>
      </Dialog>
    );
  };
}

export default withStyles(styles)(WarningModal);
