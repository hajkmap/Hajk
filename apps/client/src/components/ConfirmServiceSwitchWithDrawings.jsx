// Dialog for AttributeEditor and Sketch
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Trans, useTranslation } from "react-i18next";

export default function ConfirmServiceSwitchWithDrawings({
  open,
  onClose,
  onConfirm,
  onClearDrawings,
  drawingCount,
  targetServiceName,
}) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      slotProps={{
        paper: {
          sx: {
            width: "690px",
          },
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningAmberIcon color="warning" />
        {t("confirmServiceSwitch.title")}
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t("confirmServiceSwitch.drawingCount", { count: drawingCount })}
        </Alert>
        <DialogContentText>
          <Trans
            i18nKey="confirmServiceSwitch.selectingService"
            values={{ name: targetServiceName }}
            components={{ strong: <strong /> }}
          />
        </DialogContentText>
        <DialogContentText sx={{ mt: 2 }}>
          <Trans
            i18nKey="confirmServiceSwitch.note"
            components={{ strong: <strong /> }}
          />
        </DialogContentText>
        <DialogContentText sx={{ mt: 2 }}>
          {t("confirmServiceSwitch.question")}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 1.5, pb: 1 }}>
        <Button onClick={onClose} color="inherit">
          {t("common.cancel")}
        </Button>
        <Button onClick={onClearDrawings} color="error" variant="outlined">
          {t("confirmServiceSwitch.clearDrawings")}
        </Button>
        <Button onClick={onConfirm} color="primary" variant="contained">
          {t("confirmServiceSwitch.keepDrawings")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
