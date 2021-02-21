import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";

import {
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@material-ui/core";

const styles = (theme) => {};

class PrintDialog extends React.PureComponent {
  render() {
    const { cancelPrint, open, saveAsType } = this.props;
    return createPortal(
      <Dialog
        disableBackdropClick={true}
        disableEscapeKeyDown={true}
        open={open}
      >
        <LinearProgress />
        <DialogTitle>Din {`${saveAsType}`} skapas</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Det här kan ta en stund, speciellt om du har valt ett stort format
            (A2-A3) och hög upplösning (>72 dpi). Men när allt är klart kommer{" "}
            {`${saveAsType}`}-filen att laddas ner till din dator.
            <br />
            <br />
            Om du inte vill vänta längre kan du avbryta utskriften genom att
            trycka på knappen nedan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={cancelPrint}>
            Avbryt
          </Button>
        </DialogActions>
      </Dialog>,
      document.getElementById("root")
    );
  }
}

export default withStyles(styles)(withSnackbar(PrintDialog));
