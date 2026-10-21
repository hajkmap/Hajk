import React, { useState } from "react";
import BaseDialog from "components/Dialog/BaseDialog";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";

import { Trans } from "react-i18next";
import i18n from "src/i18n";

import type { InfoDialogProps } from "../types";

function InfoDialog({ localObserver }: InfoDialogProps) {
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
    <BaseDialog
      open={clearDialogVisible}
      onClose={handleClose}
      scroll="body"
      onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
        // Needed to disabled unwanted dragging of the underlying Window component
        // and allow text selection in Dialog.
        e.stopPropagation();
      }}
    >
      <DialogTitle>{i18n.t("common.help")}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1">
          {i18n.t("propertyChecker.help.generalTitle")}
        </Typography>
        <DialogContentText>
          {i18n.t("propertyChecker.help.general")}
        </DialogContentText>
      </DialogContent>
      <DialogContent>
        <Typography variant="subtitle1">
          {i18n.t("propertyChecker.help.mainButtonTitle")}
        </Typography>
        <DialogContentText>
          <Trans
            i18nKey="propertyChecker.help.mainButton"
            components={{ i: <i />, br: <br /> }}
          />
        </DialogContentText>
      </DialogContent>
      <DialogContent>
        <Typography variant="subtitle1">
          {i18n.t("propertyChecker.help.quickLayersTitle")}
        </Typography>
        <DialogContentText>
          {i18n.t("propertyChecker.help.quickLayers")}
        </DialogContentText>
      </DialogContent>
      <DialogContent>
        <Typography variant="subtitle1">
          {i18n.t("propertyChecker.help.listViewTitle")}
        </Typography>
        <DialogContentText>
          <Trans
            i18nKey="propertyChecker.help.listView"
            components={{ b: <b />, br: <br /> }}
          />
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{i18n.t("common.close")}</Button>
      </DialogActions>
    </BaseDialog>
  );
}

export default InfoDialog;
