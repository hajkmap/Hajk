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

export default function ConfirmServiceSwitchWithDrawings({
  open,
  onClose,
  onConfirm,
  onClearDrawings,
  drawingCount,
  targetServiceName,
}) {
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
        Ritade objekt i kartan
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Du har {drawingCount} ritade objekt i kartan som inte är kopplade till
          någon redigeringstjänst.
        </Alert>
        <DialogContentText>
          Du är på väg att välja redigeringstjänsten{" "}
          <strong>{targetServiceName}</strong>.
        </DialogContentText>
        <DialogContentText sx={{ mt: 2 }}>
          <strong>OBS:</strong> Ritade objekt och redigeringstjänster är
          separata system. Om du behåller de ritade objekten kommer de finnas
          kvar i kartan men kan inte sparas tillsammans med redigeringstjänsten.
        </DialogContentText>
        <DialogContentText sx={{ mt: 2 }}>Vad vill du göra?</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 1.5, pb: 1 }}>
        <Button onClick={onClose} color="inherit">
          Avbryt
        </Button>
        <Button onClick={onClearDrawings} color="error" variant="outlined">
          Ta bort ritade objekt
        </Button>
        <Button onClick={onConfirm} color="primary" variant="contained">
          Behåll ritade objekt (endast för referens)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
