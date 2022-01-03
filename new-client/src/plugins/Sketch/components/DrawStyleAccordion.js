import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { TwitterPicker } from "react-color";

import { Box, Grid, Typography, Tooltip, Slider } from "@material-ui/core";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from "@material-ui/core";

// We want to use an accordion-summary, but we have to style it a bit so
// it looks OK. Let's create a styled accordion-summary.
const StyledAccordionSummary = withStyles({
  root: {
    minHeight: 35,
    "&$expanded": {
      minHeight: 35,
    },
  },
  content: {
    transition: "inherit !important",
    marginTop: "0",
    marginBottom: "0",
    "&$expanded": {
      marginTop: "0",
      marginBottom: "0",
    },
  },
  expanded: {},
})(AccordionSummary);

// We want to be able to display the current color. Let's create
// a color-badge component.
const ColorBadge = ({ color }) => {
  return (
    <Box
      style={{
        height: "1.1rem",
        width: "1.1rem",
        backgroundColor: color,
        borderRadius: "10%",
      }}
    />
  );
};

// We want to be able to change the opacity of the fill color. Let's
// create a slider that can be used to change the value.
const OpacitySlider = ({ opacity, handleOpacityChange }) => {
  return (
    <Grid item xs={12}>
      <Slider
        min={0}
        max={100}
        value={opacity}
        step={1}
        onChange={handleOpacityChange}
        valueLabelFormat={(value) => `${value}%`}
        valueLabelDisplay="auto"
      />
      <Typography variant="caption">{`Opacitet: ${opacity}%`}</Typography>
    </Grid>
  );
};

// The draw-style-accordion includes a summary showing the current draw-style-settings.
// It also includes tools to update the current style.
const DrawStyleAccordion = (props) => {
  return (
    <Accordion size="small" style={{ marginBottom: 8 }}>
      <Tooltip title={`Klicka här för att ändra ${props.title.toLowerCase()}.`}>
        <StyledAccordionSummary>
          <Grid container justify="space-between" alignItems="center">
            <Typography variant="button">{props.title}</Typography>
            <ColorBadge color={props.color} />
          </Grid>
        </StyledAccordionSummary>
      </Tooltip>
      <AccordionDetails style={{ maxWidth: "100%" }}>
        <Grid container>
          <Grid item xs={12}>
            <TwitterPicker
              triangle="hide"
              onChange={props.handleColorChange}
              styles={{
                default: {
                  card: {
                    maxWidth: "100%",
                    background: "unset", // Hard-coded to white, we don't want that.
                  },
                },
              }}
              color={props.color}
            />
          </Grid>
          {props.showOpacitySlider && (
            <OpacitySlider
              handleOpacityChange={props.handleOpacityChange}
              opacity={props.opacity}
            />
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default DrawStyleAccordion;
