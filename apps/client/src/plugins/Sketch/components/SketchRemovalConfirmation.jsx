import React from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

// Simple dialog that is used to confirm that the user actually wants
// to remove a sketch from LS.
const SketchRemovalConfirmation = ({ open, handleConfirm, handleAbort }) => {
  return createPortal(
    <Dialog
      open={open}
      onClose={handleAbort}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <DialogTitle>Radera arbetsyta</DialogTitle>
      <DialogContent>
        <Typography>
          Är du säker på att du vill radera arbetsytan? Detta går inte att
          ångra.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleConfirm}>Radera</Button>
        <Button onClick={handleAbort} variant="contained">
          Avbryt
        </Button>
      </DialogActions>
    </Dialog>,
    document.getElementById("map")
  );
};

export default SketchRemovalConfirmation;
