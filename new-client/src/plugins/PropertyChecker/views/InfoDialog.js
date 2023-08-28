import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
    <Dialog open={clearDialogVisible} onClose={handleClose}>
      <DialogTitle>Om verktyget</DialogTitle>
      <DialogContent>
        <DialogContentText>
          När du rensar resultatlistan försvinner markören för respektive lager.
          Du kommer inte längre kunna se vilka lager som påverkar fastigheten
          eller vilken fastighet du fick träff på.
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
