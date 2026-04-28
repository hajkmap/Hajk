import React from "react";
import { createPortal } from "react-dom";

import BaseDialog from "components/Dialog/BaseDialog";
import {
  Button,
  LinearProgress,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";

export default function PrintDialog({ cancelPrint, open }) {
  return createPortal(
    <BaseDialog disableEscapeKeyDown={true} open={open}>
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
    </BaseDialog>,
    document.getElementById("root")
  );
}
