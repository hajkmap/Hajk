import React from "react";

import BaseDialog from "components/Dialog/BaseDialog";
import {
  Button,
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
import i18n from "src/i18n";

import type {
  LayerCheckerReportDialogProps,
  ControlledLayer,
} from "../../types";

export default function ReportDialog({
  reportDialogVisible,
  setReportDialogVisible,
  currentPropertyName,
  controlledLayers,
  layerNotes,
  userDetails,
}: LayerCheckerReportDialogProps) {
  // Helper: Prepare plain text version of the report, used for clipboard.
  const getPlainTextForClipboard = () => {
    return (
      `${i18n.t("propertyChecker.report.titleUpper", { property: currentPropertyName })}\n` +
      "\n" +
      `${i18n.t("propertyChecker.report.layersIntro")}\n\n` +
      controlledLayers
        .map(
          (l: ControlledLayer) =>
            // Take only care of current property's layers.
            l.propertyName === currentPropertyName &&
            // Produce a nice looking line for each item. We want it
            // to look like a list, so let's start with an indentation and a dash.
            // Next, print layer's caption and subcaption (if it exists).
            ` - ${l.caption}` +
              (l.subcaption !== null ? ` (${l.subcaption})` : "") +
              (getLayerNotesAsArray(l.id).length > 0
                ? `\n   ${i18n.t("propertyChecker.report.note")} ${getLayerNotesAsArray(l.id)?.join(" ")}`
                : "")
        )
        .join("\n") + // Finally, join the array into a string using new line as join character.
      "\n\n" +
      getUserDetailsText() +
      "\n\n" +
      i18n.t("propertyChecker.report.dataDate", {
        date: new Date().toLocaleDateString(),
      })
    );
  };

  // Helper: Prepare plain text version of the report, used for clipboard.
  const getHtmlFormattedTextForClipboard = () => {
    return (
      `<h1>${i18n.t("propertyChecker.report.title", { property: currentPropertyName })}</h1>` +
      `<p>${i18n.t("propertyChecker.report.layersIntro")}</p>` +
      "<ul>" +
      controlledLayers
        .map((l: ControlledLayer) =>
          // Take only care of current property's layers.
          l.propertyName === currentPropertyName
            ? // Produce a nice looking line for each item. We want it
              // to look like a list, so let's start with an indentation and a dash.
              // Next, print layer's caption and subcaption (if it exists).
              "<li>" +
              l.caption +
              (l.subcaption !== null ? ` (${l.subcaption})` : "") +
              (getLayerNotesAsArray(l.id).length > 0
                ? `<br>${i18n.t("propertyChecker.report.note")} `
                : "") +
              getLayerNotesAsArray(l.id)
                .map((s: string) => s)
                .join("<br>") +
              "</li>"
            : ""
        )
        .join("") + // Finally, join the array into a string using new line as join character.
      "</ul>" +
      `<p>${getUserDetailsText()}</p>` +
      `<p>${i18n.t("propertyChecker.report.dataDate", { date: new Date().toLocaleDateString() })}</p>`
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
        alert(i18n.t("propertyChecker.reportCopied"));
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
      return i18n.t("propertyChecker.report.reviewedBy", {
        description: userDetails.description,
        displayName: userDetails.displayName,
      });
    } else {
      return "";
    }
  };

  const getLayerNotesAsArray = (lid: string): string[] => {
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
      <BaseDialog
        open={reportDialogVisible}
        onClose={() => {
          setReportDialogVisible(false);
        }}
        onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
          // Needed to disabled unwanted dragging of the underlying Window component
          // and allow text selection in Dialog.
          e.stopPropagation();
        }}
      >
        <DialogTitle>
          {i18n.t("propertyChecker.report.title", {
            property: currentPropertyName,
          })}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {i18n.t("propertyChecker.report.layersIntro")}
          </Typography>
          <List>
            {controlledLayers.map((l: ControlledLayer, key: number) => {
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
                          <Typography variant="h6" component="div">
                            {l.caption}
                          </Typography>
                          <Typography variant="body2" component="div">
                            {l.subcaption}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          {getLayerNotesAsArray(l.id).map(
                            (s: string, i: number) => (
                              <Typography
                                key={i}
                                variant="caption"
                                sx={{ display: "block" }}
                              >
                                {i === 0 &&
                                  `${i18n.t("propertyChecker.report.note")} `}{" "}
                                {s}
                              </Typography>
                            )
                          )}
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
            {i18n.t("propertyChecker.report.dataDate", {
              date: new Date().toLocaleDateString(),
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="success" variant="contained" onClick={copyToClipboard}>
            {i18n.t("propertyChecker.copyToClipboard")}
          </Button>
          <Button
            onClick={() => {
              setReportDialogVisible(false);
            }}
          >
            {i18n.t("common.close")}
          </Button>
        </DialogActions>
      </BaseDialog>
    )
  );
}
