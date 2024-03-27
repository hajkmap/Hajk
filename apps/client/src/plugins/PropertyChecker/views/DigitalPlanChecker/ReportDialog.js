import React from "react";

import {
  Button,
  Dialog,
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

export default function ReportDialog(props) {
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
      `DETALJPLAN ${digitalPlanKey}\n\n` +
      `${markerFeature.get(options.digitalPlanStatusAttribute)}: ${new Date(
        markerFeature.get(options.digitalPlanStatusDateAttribute)
      ).toLocaleDateString()}\n\n` +
      "Granskning har gjorts mot följande planbestämmelser:\n\n" +
      digitalPlansLayerSecondLevelOrder
        .map((useType, i) => {
          return (
            useType.toUpperCase() +
            "\n\n" +
            controlledRegulations
              .filter((r) => r.useType === useType)
              .map(
                (r) =>
                  // Take only care of current property's layers.
                  r.digitalPlanKey === digitalPlanKey &&
                  // Produce a nice looking line for each item. We want it
                  // to look like a list, so let's start with an indentation and a dash.

                  ` - ${r.regulationName}` +
                    `\n   ${r.regulationCaption}` +
                    (getLayerNotesAsArray(r.id).length > 0
                      ? `\n   Notering: ${getLayerNotesAsArray(r.id)?.join(
                          " "
                        )}`
                      : "")
              )
              .join("\n")
          );
        })
        .join("\n\n") + // Finally, join the array into a string using new line as join character.
      "\n\n" +
      "PLANENS SYFTE\n" +
      markerFeature.get(options.digitalPlanDescriptionAttribute) +
      "\n\n" +
      getUserDetailsText() +
      "\n\n" +
      `Rapporten utgår från data som var känd per ${new Date().toLocaleDateString()}.`
    );
  };

  // Helper: Prepare plain text version of the report, used for clipboard.
  const getHtmlFormattedTextForClipboard = () => {
    return (
      `<h1>Detaljplan: ${digitalPlanKey}</h1>` +
      `<p>${markerFeature.get(options.digitalPlanStatusAttribute)}: ${new Date(
        markerFeature.get(options.digitalPlanStatusDateAttribute)
      ).toLocaleDateString()}</p>` +
      "<h2>Granskning har gjorts mot följande planbestämmelser:</h2>" +
      digitalPlansLayerSecondLevelOrder
        .map((useType, i) => {
          return (
            `<h3>${useType.toUpperCase()}</h3>` +
            "<ul>" +
            controlledRegulations
              .filter((r) => r.useType === useType)
              .map(
                (r) =>
                  // Take only care of current property's layers.
                  r.digitalPlanKey === digitalPlanKey &&
                  // Produce a nice looking line for each item. We want it
                  // to look like a list, so let's start with an indentation and a dash.

                  "<li>" +
                    r.regulationName +
                    "<br>" +
                    r.regulationCaption +
                    "<br>" +
                    (getLayerNotesAsArray(r.id).length > 0
                      ? `Notering: ${getLayerNotesAsArray(r.id)
                          ?.map((s) => `${s}<br>`)
                          .join("")}`
                      : "") +
                    "</li>"
              )
              .join("") +
            "</ul>"
          );
        })
        .join("") +
      "<h2>Planens syfte</h2>" +
      "<p>" +
      markerFeature.get(options.digitalPlanDescriptionAttribute) +
      "</p>" +
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

  const TextParagraph = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(2),
  }));

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
        <DialogTitle variant="h4">Detaljplan {digitalPlanKey}</DialogTitle>
        <DialogContent>
          <TextParagraph>
            {`${markerFeature.get(
              options.digitalPlanStatusAttribute
            )}: ${new Date(
              markerFeature.get(options.digitalPlanStatusDateAttribute)
            ).toLocaleDateString()}`}
          </TextParagraph>
          <Typography gutterBottom variant="h5">
            Granskning har gjorts mot följande planbestämmelser:
          </Typography>
          {digitalPlansLayerSecondLevelOrder.map((useType, i) => {
            const filteredRegulations = controlledRegulations.filter(
              (r) => r.useType === useType
            );
            return (
              filteredRegulations.length > 0 && (
                <React.Fragment key={i}>
                  <Typography variant="h6">{useType}</Typography>
                  <List>
                    {filteredRegulations.map((l, key) => {
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
                                  <Typography variant="subtitle2" element="div">
                                    {l.regulationName}
                                  </Typography>
                                  <Typography variant="body2" element="div">
                                    {l.regulationCaption}
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
                </React.Fragment>
              )
            );
          })}

          <Typography gutterBottom variant="h5">
            Planens syfte
          </Typography>

          <TextParagraph>
            {markerFeature.get(options.digitalPlanDescriptionAttribute)}
          </TextParagraph>

          <Typography gutterBottom variant="h5">
            Om rapporten
          </Typography>
          <TextParagraph>{getUserDetailsText()}</TextParagraph>
          <TextParagraph>
            Rapporten utgår från data som var känd per{" "}
            {new Date().toLocaleDateString()}.
          </TextParagraph>
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
