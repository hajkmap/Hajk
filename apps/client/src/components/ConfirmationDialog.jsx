import React from "react";
import { createPortal } from "react-dom";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import BaseDialog from "./Dialog/BaseDialog";

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
    <BaseDialog
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
        {confirm && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleConfirm();
            }}
            variant="contained"
          >
            {confirm}
          </Button>
        )}
      </DialogActions>
    </BaseDialog>,
    document.getElementById("map")
  );
};

export default ConfirmationDialog;
