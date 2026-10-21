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
import i18n from "src/i18n";

export default function PrintDialog({ cancelPrint, open }) {
  return createPortal(
    <BaseDialog disableEscapeKeyDown={true} open={open}>
      <LinearProgress />
      <DialogTitle>{i18n.t("timeSlider.print.dialogTitle")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {i18n.t("timeSlider.print.dialogText")}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={cancelPrint}>
          {i18n.t("common.cancel")}
        </Button>
      </DialogActions>
    </BaseDialog>,
    document.getElementById("root")
  );
}
