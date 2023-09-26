import React, { useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

export default function ReportDialog({
  reportDialogVisible,
  setReportDialogVisible,
  currentPropertyName,
  controlledLayers,
}) {
  return (
    reportDialogVisible && (
      <Dialog
        open={reportDialogVisible}
        onClose={() => {
          setReportDialogVisible(false);
        }}
        onMouseDown={(e) => {
          // Needed to disabled unwanted dragging of the underlying Window component
          // and allow text selection in Dialog.
          e.stopPropagation();
        }}
      >
        <DialogTitle>Granskningsrapport {currentPropertyName}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Granskning har gjorts mot följande kartlager:
          </DialogContentText>
          <List>
            {controlledLayers.map((l, key) => {
              return (
                l.propertyName === currentPropertyName && (
                  <ListItem key={key}>
                    <ListItemText secondary={l.subcaption}>
                      {l.caption}
                    </ListItemText>
                  </ListItem>
                )
              );
            })}
          </List>
        </DialogContent>
      </Dialog>
    )
  );
}
