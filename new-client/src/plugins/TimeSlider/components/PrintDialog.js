import React from "react";
import { createPortal } from "react-dom";

import {
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";

export default function PrintDialog({ cancelPrint, open }) {
  return createPortal(
    <Dialog disableEscapeKeyDown={true} open={open}>
      <LinearProgress />
      <DialogTitle>Dina bilder skapas</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Det här kan ta en stund, speciellt om det är många bilder som ska
          skapas.
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
