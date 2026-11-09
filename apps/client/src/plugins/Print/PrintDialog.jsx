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
import i18n from "src/i18n";
import { Trans } from "react-i18next";

class PrintDialog extends React.PureComponent {
  render() {
    const { cancelPrint, open, saveAsType } = this.props;
    return createPortal(
      <BaseDialog disableEscapeKeyDown={true} open={open}>
        <LinearProgress />
        <DialogTitle>
          {i18n.t("print.dialog.title", { type: saveAsType })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Trans
              i18n={i18n}
              i18nKey="print.dialog.text"
              values={{ type: saveAsType }}
              components={{ br: <br /> }}
            />
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
}

export default PrintDialog;
