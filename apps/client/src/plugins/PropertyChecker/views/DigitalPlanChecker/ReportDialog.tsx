import React from "react";

import BaseDialog from "components/Dialog/BaseDialog";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

import { Box } from "@mui/system";
import { styled } from "@mui/material/styles";
import i18n from "src/i18n";

import type {
  DigitalPlanReportDialogProps,
  ControlledRegulation,
} from "../../types";

const TextParagraph = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export default function ReportDialog(props: DigitalPlanReportDialogProps) {
  const {
    reportDialogVisible,
    setReportDialogVisible,
    digitalPlanKey,
    markerFeature,
    controlledRegulations,
    layerNotes,
    userDetails,
    options,
  } = props;
  const { digitalPlansLayerSecondLevelOrder } = options;
  // Helper: Prepare plain text version of the report, used for clipboard.
  const getPlainTextForClipboard = () => {
    return (
      `${i18n.t("propertyChecker.report.planTitleUpper", { plan: digitalPlanKey })}\n\n` +
      `${markerFeature.get(options.digitalPlanStatusAttribute)}: ${new Date(
        markerFeature.get(options.digitalPlanStatusDateAttribute)
      ).toLocaleDateString()}\n\n` +
      `${i18n.t("propertyChecker.report.regulationsIntro")}\n\n` +
      digitalPlansLayerSecondLevelOrder
        .map((useType: string) => {
          return (
            useType.toUpperCase() +
            "\n\n" +
            controlledRegulations
              .filter((r: ControlledRegulation) => r.useType === useType)
              .map(
                (r: ControlledRegulation) =>
                  // Take only care of current property's layers.
                  r.digitalPlanKey === digitalPlanKey &&
                  // Produce a nice looking line for each item. We want it
                  // to look like a list, so let's start with an indentation and a dash.

                  ` - ${r.regulationName}` +
                    `\n   ${r.regulationCaptionAsArray.join("\n   ")}` +
                    (getLayerNotesAsArray(r.id).length > 0
                      ? `\n   ${i18n.t("propertyChecker.report.note")} ${getLayerNotesAsArray(
                          r.id
                        )?.join(" ")}`
                      : "")
              )
              .join("\n")
          );
        })
        .join("\n\n") + // Finally, join the array into a string using new line as join character.
      "\n\n" +
      `${i18n.t("propertyChecker.report.planPurpose").toUpperCase()}\n` +
      markerFeature.get(options.digitalPlanDescriptionAttribute) +
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
      `<h1>${i18n.t("propertyChecker.report.planTitleHtml", { plan: digitalPlanKey })}</h1>` +
      `<p>${markerFeature.get(options.digitalPlanStatusAttribute)}: ${new Date(
        markerFeature.get(options.digitalPlanStatusDateAttribute)
      ).toLocaleDateString()}</p>` +
      `<h2>${i18n.t("propertyChecker.report.regulationsIntro")}</h2>` +
      digitalPlansLayerSecondLevelOrder
        .map((useType: string) => {
          return (
            `<h3>${useType.toUpperCase()}</h3>` +
            "<ul>" +
            controlledRegulations
              .filter((r: ControlledRegulation) => r.useType === useType)
              .map(
                (r: ControlledRegulation) =>
                  // Take only care of current property's layers.
                  r.digitalPlanKey === digitalPlanKey &&
                  // Produce a nice looking line for each item. We want it
                  // to look like a list, so let's start with an indentation and a dash.

                  "<li>" +
                    r.regulationName +
                    "<br>" +
                    r.regulationCaptionAsArray.join("<br>") +
                    "<br>" +
                    (getLayerNotesAsArray(r.id).length > 0
                      ? `${i18n.t("propertyChecker.report.note")} ${getLayerNotesAsArray(
                          r.id
                        )
                          ?.map((s: string) => `${s}<br>`)
                          .join("")}`
                      : "") +
                    "</li>"
              )
              .join("") +
            "</ul>"
          );
        })
        .join("") +
      `<h2>${i18n.t("propertyChecker.report.planPurpose")}</h2>` +
      "<p>" +
      markerFeature.get(options.digitalPlanDescriptionAttribute) +
      "</p>" +
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
        <DialogTitle variant="h4">
          {i18n.t("propertyChecker.report.planTitle", { plan: digitalPlanKey })}
        </DialogTitle>
        <DialogContent>
          <TextParagraph>
            {`${markerFeature.get(
              options.digitalPlanStatusAttribute
            )}: ${new Date(
              markerFeature.get(options.digitalPlanStatusDateAttribute)
            ).toLocaleDateString()}`}
          </TextParagraph>
          <Typography gutterBottom variant="h5">
            {i18n.t("propertyChecker.report.regulationsIntro")}
          </Typography>
          {digitalPlansLayerSecondLevelOrder.map(
            (useType: string, i: number) => {
              const filteredRegulations = controlledRegulations.filter(
                (r: ControlledRegulation) => r.useType === useType
              );
              return (
                filteredRegulations.length > 0 && (
                  <React.Fragment key={i}>
                    <Typography variant="h6">{useType}</Typography>
                    <List>
                      {filteredRegulations.map(
                        (l: ControlledRegulation, key: number) => {
                          return (
                            l.digitalPlanKey === digitalPlanKey && (
                              <ListItem key={key} alignItems="flex-start">
                                {/* <ListItemAvatar>
                            <CheckBoxIcon />
                          </ListItemAvatar> */}
                                <ListItemText
                                  disableTypography
                                  primary={
                                    <Box sx={{ mb: 1 }}>
                                      <Typography
                                        variant="subtitle2"
                                        component="div"
                                      >
                                        {l.regulationName}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        component="div"
                                      >
                                        {l.regulationCaptionAsElement}
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
                        }
                      )}
                    </List>
                  </React.Fragment>
                )
              );
            }
          )}
          <Typography gutterBottom variant="h5">
            {i18n.t("propertyChecker.report.planPurpose")}
          </Typography>
          <TextParagraph>
            {markerFeature.get(options.digitalPlanDescriptionAttribute)}
          </TextParagraph>
          <Typography gutterBottom variant="h5">
            {i18n.t("propertyChecker.report.about")}
          </Typography>
          <TextParagraph>{getUserDetailsText()}</TextParagraph>
          <TextParagraph>
            {i18n.t("propertyChecker.report.dataDate", {
              date: new Date().toLocaleDateString(),
            })}
          </TextParagraph>
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
