import React from "react";
import { styled } from "@mui/material/styles";
import { Grid, Typography, Tooltip } from "@mui/material";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import Buffer from "plugins/Sketch/components/SketchBuffer/Buffer";

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

const FeatureBufferAccordion = (props) => {
  return (
    <Accordion size="small" style={{ marginBottom: 8 }}>
      <Tooltip
        disableInteractive
        title={`Klicka här för att ändra ${props.title.toLowerCase()}.`}
      >
        <StyledAccordionSummary>
          <Grid container justifyContent="space-between" alignItems="center">
            <Typography variant="button">{props.title}</Typography>
          </Grid>
        </StyledAccordionSummary>
      </Tooltip>
      <AccordionDetails style={{ maxWidth: "100%" }}>
        <Grid container>
          {props.showBufferSlider && (
            <Grid item xs={12} style={{ marginTop: 8 }}>
              <Buffer
                drawModel={props.drawModel}
                localObserver={props.localObserver}
                globalObserver={props.globalObserver}
                setPluginShown={props.setPluginShown}
                pluginShown={props.pluginShown}
                showBufferSlider={props.showBufferSlider}
                bufferState={props.bufferState}
                setBufferState={props.setBufferState}
                highlightLayer={props.highlightLayer}
                bufferLayer={props.bufferLayer}
                toggleBufferBtn={props.toggleBufferBtn}
                setToggleBufferBtn={props.setToggleBufferBtn}
              />
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default FeatureBufferAccordion;
