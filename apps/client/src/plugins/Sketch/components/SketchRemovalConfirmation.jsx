import { createPortal } from "react-dom";
import BaseDialog from "components/Dialog/BaseDialog";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import i18n from "src/i18n";

// Simple dialog that is used to confirm that the user actually wants
// to remove a sketch from LS.
const SketchRemovalConfirmation = ({ open, handleConfirm, handleAbort }) => {
  return createPortal(
    <BaseDialog
      open={open}
      onClose={handleAbort}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <DialogTitle>{i18n.t("sketch.save.deleteTitle")}</DialogTitle>
      <DialogContent>
        <Typography>{i18n.t("sketch.save.deleteConfirm")}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleConfirm}>{i18n.t("sketch.deleteButton")}</Button>
        <Button onClick={handleAbort} variant="contained">
          {i18n.t("common.cancel")}
        </Button>
      </DialogActions>
    </BaseDialog>,
    document.getElementById("map")
  );
};

export default SketchRemovalConfirmation;
