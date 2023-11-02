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

// Simple dialog that can be used to prompt the user before committing action.
const ConfirmationDialog = ({
  open,
  handleConfirm,
  handleAbort,
  titleName,
  contentDescription,
  cancel,
  confirm,
}) => {
  return createPortal(
    <Dialog
      open={open}
      onClose={handleAbort}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <DialogTitle>{titleName}</DialogTitle>
      <DialogContent>
        <Typography>{contentDescription}</Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleAbort();
          }}
        >
          {cancel}
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleConfirm();
          }}
          variant="contained"
        >
          {confirm}
        </Button>
      </DialogActions>
    </Dialog>,
    document.getElementById("map")
  );
};

export default ConfirmationDialog;
