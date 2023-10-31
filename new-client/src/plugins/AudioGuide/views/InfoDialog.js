import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";

function InfoDialog({ localObserver }) {
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  const handleClose = () => {
    setClearDialogVisible(false);
  };

  const handleOpen = () => {
    setClearDialogVisible(true);
  };

  React.useEffect(() => {
    localObserver.subscribe("showInfoDialog", handleOpen);

    return () => {
      localObserver.unsubscribe("showInfoDialog", handleOpen);
    };
  }, [localObserver]);

  return (
    <Dialog
      open={clearDialogVisible}
      onClose={handleClose}
      scroll="body"
      onMouseDown={(e) => {
        // Needed to disabled unwanted dragging of the underlying Window component
        // and allow text selection in Dialog.
        e.stopPropagation();
      }}
    >
      <DialogTitle>Hjälp</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1">Allmänt</Typography>
        <DialogContentText>Info om AudioGuiden.</DialogContentText>
      </DialogContent>
      <DialogContent>
        <Typography variant="subtitle1">Mer info</Typography>
        <DialogContentText>
          Läs vidare.
          <br />
          <br />
          Mer text.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          Stäng
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InfoDialog;
