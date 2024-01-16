import React from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";

import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { Box } from "@mui/system";

export default function ReportDialog({
  reportDialogVisible,
  setReportDialogVisible,
  currentPropertyName,
  controlledLayers,
  layerNotes,
  userDetails,
}) {
  // Helper: Prepare plain text version of the report, used for clipboard.
  const getPlainTextForClipboard = () => {
    return (
      `GRANSKNINGSRAPPORT ${currentPropertyName}\n` +
      "\n" +
      "Granskning har gjorts mot följande kartlager:\n\n" +
      controlledLayers
        .map(
          (l) =>
            // Take only care of current property's layers.
            l.propertyName === currentPropertyName &&
            // Produce a nice looking line for each item. We want it
            // to look like a list, so let's start with an indentation and a dash.
            // Next, print layer's caption and subcaption (if it exists).
            ` - ${l.caption}` +
              (l.subcaption !== null ? ` (${l.subcaption})` : "") +
              (getLayerNotesAsArray(l.id).length > 0
                ? `\n   Notering: ${getLayerNotesAsArray(l.id)?.join(" ")}`
                : "")
        )
        .join("\n") + // Finally, join the array into a string using new line as join character.
      "\n\n" +
      getUserDetailsText() +
      "\n\n" +
      `Rapporten utgår från data som var känd per ${new Date().toLocaleDateString()}.`
    );
  };

  // Helper: Prepare plain text version of the report, used for clipboard.
  const getHtmlFormattedTextForClipboard = () => {
    return (
      `<h1>Granskningsrapport ${currentPropertyName}</h1>` +
      "<p>Granskning har gjorts mot följande kartlager:</p>" +
      "<ul>" +
      controlledLayers
        .map((l) =>
          // Take only care of current property's layers.
          l.propertyName === currentPropertyName
            ? // Produce a nice looking line for each item. We want it
              // to look like a list, so let's start with an indentation and a dash.
              // Next, print layer's caption and subcaption (if it exists).
              "<li>" +
              l.caption +
              (l.subcaption !== null ? ` (${l.subcaption})` : "") +
              (getLayerNotesAsArray(l.id).length > 0 ? "<br>Notering: " : "") +
              getLayerNotesAsArray(l.id)
                .map((s) => s)
                .join("<br>") +
              "</li>"
            : ""
        )
        .join("") + // Finally, join the array into a string using new line as join character.
      "</ul>" +
      `<p>${getUserDetailsText()}</p>` +
      `<p>Rapporten utgår från data som var känd per ${new Date().toLocaleDateString()}.</p>`
    );
  };

  const copyToClipboard = () => {
    const blobText = new Blob([getPlainTextForClipboard()], {
      type: "text/plain",
    });
    const blobHtml = new Blob([getHtmlFormattedTextForClipboard()], {
      type: "text/html",
    });
    const data = [
      new ClipboardItem({
        "text/plain": blobText,
        "text/html": blobHtml,
      }),
    ];

    navigator.clipboard.write(data).then(
      () => {
        alert("Rapporten har kopierats till urklipp");
      },
      () => {}
    );
  };

  const getUserDetailsText = () => {
    if (
      userDetails !== undefined &&
      Object.hasOwn(userDetails, "displayName") &&
      Object.hasOwn(userDetails, "description")
    ) {
      return `Granskningen genomfördes av ${userDetails.description} genom ${userDetails.displayName}.`;
    } else {
      return "";
    }
  };

  const getLayerNotesAsArray = (lid) => {
    // Let's use the 'lid' (layer ID) to find a corresponding
    // value in layerNotes. Next, split on new lines and remove
    // duplicate new lines. Finally, put it all together to an array
    // of strings. This way, each element will hold its own paragraph
    // and we'll be able to style these paragraphs however we want,
    // depending on the rendering method (MUI? Html? Plain text?).
    return layerNotes?.[lid]?.split("\n").filter((s) => s.length > 0) || [];
  };

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
          <Typography gutterBottom>
            Granskning har gjorts mot följande kartlager:
          </Typography>
          <List>
            {controlledLayers.map((l, key) => {
              return (
                l.propertyName === currentPropertyName && (
                  <ListItem key={key} alignItems="flex-start">
                    <ListItemAvatar>
                      <CheckBoxIcon />
                    </ListItemAvatar>
                    <ListItemText
                      disableTypography
                      primary={
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="h6" element="div">
                            {l.caption}
                          </Typography>
                          <Typography variant="body2" element="div">
                            {l.subcaption}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          {getLayerNotesAsArray(l.id).map((s, i) => (
                            <Typography
                              key={i}
                              variant="caption"
                              sx={{ display: "block" }}
                            >
                              {i === 0 && "Notering: "} {s}
                            </Typography>
                          ))}
                        </>
                      }
                    />
                  </ListItem>
                )
              );
            })}
          </List>
          <Typography gutterBottom>{getUserDetailsText()}</Typography>
          <Typography gutterBottom>
            Rapporten utgår från data som var känd per{" "}
            {new Date().toLocaleDateString()}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="success" variant="contained" onClick={copyToClipboard}>
            Kopiera till urklipp
          </Button>
          <Button
            onClick={() => {
              setReportDialogVisible(false);
            }}
          >
            Stäng
          </Button>
        </DialogActions>
      </Dialog>
    )
  );
}
