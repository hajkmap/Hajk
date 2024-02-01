import React from "react";
import { styled } from "@mui/material/styles";

import { Grid, Typography, Tooltip } from "@mui/material";

import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";

import Buffer from "plugins/Sketch/components/NewBuffer/Buffer";

const StyledAccordionSummary = styled(AccordionSummary)(() => ({
  minHeight: 35,
  "&.MuiAccordionSummary-root.Mui-expanded": {
    minHeight: 35,
  },
  "& .MuiAccordionSummary-content": {
    transition: "inherit !important",
    marginTop: 0,
    marginBottom: 0,
    "&.Mui-expanded": {
      marginTop: 0,
      marginBottom: 0,
    },
  },
}));

const AccordionSummaryContents = (props) => {
  // We need to get the string-representation of the supplied color-object
  // to be used in the color badge... (If it not already a string).

  // Then we'll render everything!
  return (
    <Grid container justifyContent="space-between" alignItems="center">
      <Typography variant="button">{props.title}</Typography>
    </Grid>
  );
};

// The draw-style-accordion includes a summary showing the current draw-style-settings.
// It also includes tools to update the current style.
const FeatureBufferAccordion = (props) => {
  return (
    <Accordion size="small" style={{ marginBottom: 8 }}>
      <Tooltip
        disableInteractive
        title={`Klicka här för att ändra ${props.title.toLowerCase()}.`}
      >
        <StyledAccordionSummary>
          <AccordionSummaryContents
            title={props.title}
            drawModel={props.drawModel}
          />
        </StyledAccordionSummary>
      </Tooltip>
      <AccordionDetails style={{ maxWidth: "100%" }}>
        <Grid container>
          {props.showBufferSlider && (
            <Grid item xs={12} style={{ marginTop: 8 }}>
              <Buffer
                drawModel={props.drawModel}
                map={props.map}
                localObserver={props.localObserver}
                globalObserver={props.globalObserver}
                setPluginShown={props.setPluginShown}
                app={props.app}
                pluginShown={props.pluginShown}
                showBufferSlider={props.showBufferSlider}
                toggleObjectBufferBtn={props.toggleObjectBufferBtn}
                setToggleObjectBufferBtn={props.setToggleObjectBufferBtn}
                setBufferState={props.setBufferState}
                bufferState={props.bufferState}
                setHighlightLayer={props.setHighlightLayer}
                isHighlightLayerAdded={props.isHighlightLayerAdded}
                setIsBufferLayerAdded={props.setIsBufferLayerAdded}
                isBufferLayerAdded={props.isBufferLayerAdded}
                highlightSource={props.highlightSource}
                bufferSource={props.bufferSource}
                highlightLayer={props.highlightLayer}
                bufferLayer={props.bufferLayer}
              />
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default FeatureBufferAccordion;
